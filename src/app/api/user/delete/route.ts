import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command, ListObjectsV2CommandOutput, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function DELETE(req: Request) {
  try {
    let user = null;

    // Check for Bearer token (mobile app path)
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const supabaseAdmin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data.user) {
        user = data.user;
      }
    }

    // Fallback to cookie auth (web app path)
    if (!user) {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 1. Delete user files from Cloudflare R2
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const r2Bucket = process.env.R2_BUCKET_NAME || "recipe-keeper-assets";

    if (accountId && accessKeyId && secretAccessKey) {
      const r2Endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

      const s3Client = new S3Client({
        region: "auto",
        endpoint: r2Endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      const prefix = `${user.id}/`;

      try {
        let isTruncated = true;
        let continuationToken: string | undefined = undefined;

        while (isTruncated) {
          const listCommand: ListObjectsV2Command = new ListObjectsV2Command({
            Bucket: r2Bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          });

          const listResponse: ListObjectsV2CommandOutput = await s3Client.send(listCommand);

          if (listResponse.Contents && listResponse.Contents.length > 0) {
            const deleteParams = {
              Bucket: r2Bucket,
              Delete: {
                Objects: listResponse.Contents.map((item: any) => ({ Key: item.Key })),
                Quiet: true,
              },
            };

            const deleteCommand = new DeleteObjectsCommand(deleteParams);
            await s3Client.send(deleteCommand);
          }

          isTruncated = listResponse.IsTruncated ?? false;
          continuationToken = listResponse.NextContinuationToken;
        }
        console.log(`Successfully deleted R2 files for user ${user.id}`);
      } catch (r2Error) {
        console.error("Error deleting files from R2:", r2Error);
        // Continue to delete user even if R2 deletion fails partially
      }
    } else {
      console.warn("R2 credentials not fully configured. Skipping R2 file deletion.");
    }

    // 2. Delete user from Supabase Auth
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json(
        { success: false, error: "Server Configuration Error" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Error deleting user from Supabase Auth:", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to delete account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Account successfully deleted" });

  } catch (error) {
    console.error("Error in delete account API:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
