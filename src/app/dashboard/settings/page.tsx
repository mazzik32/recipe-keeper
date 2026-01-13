"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, LogOut, Globe, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { localeNames, type Locale } from "@/lib/i18n";
import { type MeasurementSystem } from "@/lib/i18n/units";

export default function SettingsPage() {
  const router = useRouter();
  const { locale, setLocale, measurementSystem, setMeasurementSystem, t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setEmail(user.email || "");
        setDisplayName(user.user_metadata?.display_name || "");
      }
      setIsLoading(false);
    }

    loadUser();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: t.settings.changesSavedDesc });
    }

    setIsSaving(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-peach-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-warm-gray-700 mb-2">{t.settings.title}</h1>
        <p className="text-warm-gray-500">{t.settings.profile}</p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card className="border-warm-gray-100">
          <CardHeader>
            <CardTitle className="font-display text-xl text-warm-gray-700">
              {t.settings.profile}
            </CardTitle>
            <CardDescription>
              {locale === "de" ? "Aktualisieren Sie Ihre persönlichen Informationen." : "Update your personal information."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <div
                className={`p-3 text-sm rounded-lg ${
                  message.type === "success"
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {message.text}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="displayName">{t.settings.displayName}</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={locale === "de" ? "Ihr Name" : "Your name"}
                className="border-warm-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.email}</Label>
              <Input
                id="email"
                value={email}
                disabled
                className="border-warm-gray-200 bg-warm-gray-50"
              />
              <p className="text-xs text-warm-gray-400">
                {locale === "de" ? "E-Mail kann nicht geändert werden." : "Email cannot be changed."}
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-peach-300 hover:bg-peach-400 text-warm-gray-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {locale === "de" ? "Speichern..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t.settings.saveChanges}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card className="border-warm-gray-100">
          <CardHeader>
            <CardTitle className="font-display text-xl text-warm-gray-700 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t.settings.language}
            </CardTitle>
            <CardDescription>{t.settings.languageDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t.settings.language}</Label>
              <Select
                value={locale}
                onValueChange={(value) => setLocale(value as Locale)}
              >
                <SelectTrigger className="border-warm-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(localeNames) as Locale[]).map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc === "en" ? "🇬🇧" : "🇩🇪"} {localeNames[loc]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Measurement System */}
        <Card className="border-warm-gray-100">
          <CardHeader>
            <CardTitle className="font-display text-xl text-warm-gray-700 flex items-center gap-2">
              <Ruler className="w-5 h-5" />
              {t.settings.measurementSystem}
            </CardTitle>
            <CardDescription>{t.settings.measurementDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={measurementSystem}
              onValueChange={(value) => setMeasurementSystem(value as MeasurementSystem)}
            >
              <SelectTrigger className="border-warm-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">{t.settings.metric}</SelectItem>
                <SelectItem value="imperial">{t.settings.imperial}</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="font-display text-xl text-red-600">
              {locale === "de" ? "Gefahrenzone" : "Danger Zone"}
            </CardTitle>
            <CardDescription>
              {locale === "de" ? "Unumkehrbare Aktionen." : "Irreversible actions."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t.auth.logout}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
