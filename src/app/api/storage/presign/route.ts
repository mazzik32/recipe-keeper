import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function POST(req: Request) {
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

    const { filename, contentType } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { success: false, error: "Missing filename or contentType" },
        { status: 400 }
      );
    }

    // Ensure R2 env variables exist
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const r2Bucket = process.env.R2_BUCKET_NAME || "recipe-keeper-assets";
    const r2Domain = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN;

    if (!accountId || !accessKeyId || !secretAccessKey || !r2Domain) {
      console.error("Missing R2 environment variables");
      return NextResponse.json(
        { success: false, error: "Server Configuration Error" },
        { status: 500 }
      );
    }

    const r2Endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

    const s3Client = new S3Client({
      region: "auto",
      endpoint: r2Endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Create a safe, unique filename in the user's scan directory
    const ext = filename.split('.').pop() || 'jpg';
    const uniqueId = crypto.randomUUID();
    const key = `${user.id}/scans/${uniqueId}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: r2Bucket,
      Key: key,
      ContentType: contentType,
    });

    // Generate a signed URL valid for 1 hour
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const publicUrl = `${r2Domain}/${key}`;

    return NextResponse.json({
      success: true,
      presignedUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
