"use client";

import { useState, useEffect } from "react";
import { useAbandonedCartSettings } from "@/hooks/useAbandonedCartSettings";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ShoppingCart,
  Clock,
  Bell,
  Shield,
  Loader2,
  Info,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const PRESET_TIMES = [
  { label: "1 hour", value: 60, description: "Recommended for flash sales" },
  { label: "2 hours", value: 120, description: "Most common choice" },
  { label: "4 hours", value: 240, description: "Good for browsing customers" },
  {
    label: "24 hours (1 day)",
    value: 1440,
    description: "Give customers time to decide",
  },
  { label: "2 days", value: 2880, description: "For considered purchases" },
  { label: "3 days", value: 4320, description: "For higher-value items" },
  {
    label: "7 days (1 week)",
    value: 10080,
    description: "For luxury/big purchases",
  },
  {
    label: "30 days (1 month)",
    value: 43200,
    description: "Long decision cycles",
  },
  { label: "Custom", value: -1, description: "Set your own time" },
];

const QUIET_HOURS_START = [
  { label: "8:00 PM", value: 20 },
  { label: "9:00 PM", value: 21 },
  { label: "10:00 PM", value: 22 },
  { label: "11:00 PM", value: 23 },
];

const QUIET_HOURS_END = [
  { label: "6:00 AM", value: 6 },
  { label: "7:00 AM", value: 7 },
  { label: "8:00 AM", value: 8 },
  { label: "9:00 AM", value: 9 },
];

export function AbandonedCartSettings() {
  const { settings, isLoading, isSaving, updateSettings } =
    useAbandonedCartSettings();

  const [enabled, setEnabled] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState("120");
  const [customMinutes, setCustomMinutes] = useState("");
  const [customUnit, setCustomUnit] = useState<"minutes" | "hours" | "days">(
    "hours"
  );
  const [quietHoursStart, setQuietHoursStart] = useState("22");
  const [quietHoursEnd, setQuietHoursEnd] = useState("8");
  const [maxNotificationsPerCart, setMaxNotificationsPerCart] = useState("1");

  // Load settings when data arrives
  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setQuietHoursStart(String(settings.quietHoursStart || 22));
      setQuietHoursEnd(String(settings.quietHoursEnd || 8));
      setMaxNotificationsPerCart(String(settings.maxNotificationsPerCart || 1));

      // Check if matches a preset
      const preset = PRESET_TIMES.find(
        (p) => p.value === settings.abandonmentThresholdMinutes
      );
      if (preset && preset.value !== -1) {
        setSelectedPreset(String(settings.abandonmentThresholdMinutes));
      } else {
        setSelectedPreset("-1");
        setCustomMinutes(String(settings.abandonmentThresholdMinutes));
      }
    }
  }, [settings]);

  const getThresholdMinutes = (): number => {
    if (selectedPreset !== "-1") return parseInt(selectedPreset);

    const value = parseInt(customMinutes) || 120;
    switch (customUnit) {
      case "hours":
        return value * 60;
      case "days":
        return value * 60 * 24;
      default:
        return value;
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} minutes`;
    if (minutes < 1440) return `${Math.round(minutes / 60)} hours`;
    if (minutes < 10080) return `${Math.round(minutes / 1440)} days`;
    if (minutes < 43200) return `${Math.round(minutes / 10080)} weeks`;
    return `${Math.round(minutes / 43200)} months`;
  };

  const handleSave = async () => {
    const thresholdMinutes = getThresholdMinutes();

    console.log('=== SAVE SETTINGS DEBUG ===');
    console.log('enabled state:', enabled);
    console.log('Full payload:', {
      enabled,
      abandonmentThresholdMinutes: thresholdMinutes,
      quietHoursStart: parseInt(quietHoursStart),
      quietHoursEnd: parseInt(quietHoursEnd),
      maxNotificationsPerCart: parseInt(maxNotificationsPerCart),
    });

    const success = await updateSettings({
      enabled,
      abandonmentThresholdMinutes: thresholdMinutes,
      quietHoursStart: parseInt(quietHoursStart),
      quietHoursEnd: parseInt(quietHoursEnd),
      maxNotificationsPerCart: parseInt(maxNotificationsPerCart),
    });

    if (success) {
      toast.success("Abandoned cart settings saved!");
    } else {
      toast.error("Failed to save settings");
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">
                Abandoned Cart Reminders
              </CardTitle>
              <CardDescription>
                Automatically remind customers who left items in their cart
              </CardDescription>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {enabled && (
          <>
            {/* Timing Selection */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <Label className="font-medium">When to send reminder</Label>
              </div>

              <p className="text-sm text-slate-500">
                Send notification after customer leaves items in cart for:
              </p>

              <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select timing" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_TIMES.map((preset) => (
                    <SelectItem key={preset.value} value={String(preset.value)}>
                      <div className="flex items-center justify-between w-full">
                        <span>{preset.label}</span>
                        {preset.value === 120 && (
                          <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                            Recommended
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Custom Time Input */}
              {selectedPreset === "-1" && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Input
                    type="number"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    placeholder="Enter time"
                    className="w-24"
                    min={1}
                  />
                  <Select
                    value={customUnit}
                    onValueChange={(v: "minutes" | "hours" | "days") =>
                      setCustomUnit(v)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                  {customMinutes && (
                    <span className="text-sm text-slate-500">
                      = {formatDuration(getThresholdMinutes())}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Quiet Hours */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-slate-500" />
                <Label className="font-medium">Quiet Hours</Label>
              </div>

              <p className="text-sm text-slate-500">
                Don't disturb customers during sleep hours. Notifications will
                be queued and sent after quiet hours end.
              </p>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">From</span>
                  <Select
                    value={quietHoursStart}
                    onValueChange={setQuietHoursStart}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUIET_HOURS_START.map((h) => (
                        <SelectItem key={h.value} value={String(h.value)}>
                          {h.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm">To</span>
                  <Select
                    value={quietHoursEnd}
                    onValueChange={setQuietHoursEnd}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUIET_HOURS_END.map((h) => (
                        <SelectItem key={h.value} value={String(h.value)}>
                          {h.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Max Notifications */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-slate-500" />
                <Label className="font-medium">Notification Limit</Label>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">
                  Maximum reminders per abandoned cart:
                </span>
                <Select
                  value={maxNotificationsPerCart}
                  onValueChange={setMaxNotificationsPerCart}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="7">7</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="9">9</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700">
                  We recommend sending only 1 reminder per cart. Too many
                  notifications can annoy customers and lead to uninstalls.
                </p>
              </div>
            </div>

            {/* Preview */}
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Preview</p>
              <div className="p-4 bg-slate-100 rounded-lg">
                <p className="text-sm text-slate-600">
                  When a customer adds items to cart and doesn't checkout within{" "}
                  <span className="font-semibold text-slate-900">
                    {formatDuration(getThresholdMinutes())}
                  </span>
                  , they'll receive a push notification reminding them to
                  complete their purchase.
                </p>
              </div>
            </div>
          </>
        )}

        {!enabled && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700">
              Abandoned cart reminders are disabled. Enable them to recover lost
              sales automatically.
            </p>
          </div>
        )}

        {/* Save Button */}
        <div className="pt-4 border-t flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
