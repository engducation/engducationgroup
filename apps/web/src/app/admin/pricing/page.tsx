"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  RefreshCw,
  Calendar,
  Info,
  Sparkles,
  Pencil,
  X,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface PricingData {
  packageType: string;
  basePrice: number;
  currentPrice: number;
  discountPercent: number;
  customLabel: string | null;
  customDescription: string | null;
  isEnabled: boolean;
  discountStartsAt: string | null;
  discountEndsAt: string | null;
  adminNote: string | null;
}

const PACKAGE_LABELS: Record<string, string> = {
  MONTHLY: "Gói 1 Tháng",
  "6_MONTH": "Gói 6 Tháng",
  YEAR: "Gói 1 Năm",
};

const PACKAGE_DURATIONS: Record<string, string> = {
  MONTHLY: "30 ngày",
  "6_MONTH": "180 ngày",
  YEAR: "365 ngày",
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN").format(price) + "đ";

export default function AdminPricingPage() {
  const router = useRouter();
  const [pricing, setPricing] = useState<PricingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingPackage, setEditingPackage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PricingData | null>(null);

  const fetchPricing = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pricing");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPricing(data);
    } catch {
      toast.error("Không thể tải thông tin giá");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPricing();
  }, [fetchPricing]);

  const startEdit = (pkg: PricingData) => {
    setEditingPackage(pkg.packageType);
    setEditForm({ ...pkg });
  };

  const cancelEdit = () => {
    setEditingPackage(null);
    setEditForm(null);
  };

  const handleSave = async () => {
    if (!editForm) return;

    setSaving(editForm.packageType);
    try {
      const calculatedPrice =
        editForm.discountPercent > 0
          ? Math.round(
              editForm.basePrice * (1 - editForm.discountPercent / 100),
            )
          : editForm.basePrice;

      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageType: editForm.packageType,
          currentPrice: calculatedPrice,
          discountPercent: editForm.discountPercent,
          customLabel: editForm.customLabel || null,
          customDescription: editForm.customDescription || null,
          isEnabled: editForm.isEnabled,
          discountStartsAt: editForm.discountStartsAt || null,
          discountEndsAt: editForm.discountEndsAt || null,
          adminNote: editForm.adminNote || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save");
      }

      toast.success("Đã lưu thay đổi");
      setEditingPackage(null);
      setEditForm(null);
      await fetchPricing();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể lưu thay đổi");
    } finally {
      setSaving(null);
    }
  };

  const handleReset = async (packageType: string) => {
    if (!confirm("Đặt lại giá về mặc định?")) return;

    try {
      const res = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageType }),
      });

      if (!res.ok) throw new Error("Failed to reset");

      toast.success("Đã đặt lại giá mặc định");
      await fetchPricing();
      router.refresh();
    } catch {
      toast.error("Không thể đặt lại giá");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Quản lý Giá & Giảm giá</h1>
        <p className="text-sm text-slate-500 mt-1">
          Chỉnh sửa giá và cài đặt giảm giá cho từng gói Premium
        </p>
      </div>

      {/* Packages */}
      <div className="space-y-4">
        {pricing.map((pkg) => {
          const isDiscounted =
            pkg.discountPercent > 0 && pkg.currentPrice < pkg.basePrice;
          const isEditing = editingPackage === pkg.packageType;

          if (isEditing && editForm) {
            return (
              <EditCard
                key={pkg.packageType}
                pkg={editForm}
                onChange={setEditForm}
                onSave={handleSave}
                onCancel={cancelEdit}
                saving={saving === pkg.packageType}
              />
            );
          }

          return (
            <Card
              key={pkg.packageType}
              className={`relative transition-all hover:shadow-md ${
                isDiscounted ? "ring-2 ring-emerald-500" : ""
              }`}
            >
              {isDiscounted && (
                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  -{pkg.discountPercent}%
                </div>
              )}

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {pkg.customLabel ?? PACKAGE_LABELS[pkg.packageType]}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {PACKAGE_DURATIONS[pkg.packageType]}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={pkg.isEnabled ? "default" : "secondary"}
                      className={
                        pkg.isEnabled
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }
                    >
                      {pkg.isEnabled ? "Đang bán" : "Tắt"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Price Display */}
                <div>
                  {isDiscounted ? (
                    <div className="space-y-1">
                      <span className="text-2xl font-black text-emerald-600">
                        {formatPrice(pkg.currentPrice)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400 line-through">
                          {formatPrice(pkg.basePrice)}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-emerald-600 border-emerald-200 bg-emerald-50 text-xs"
                        >
                          -{pkg.discountPercent}%
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-2xl font-black text-slate-900">
                        {formatPrice(pkg.currentPrice)}
                      </span>
                      <span className="text-slate-500 text-sm ml-1">/ gói</span>
                    </div>
                  )}
                </div>

                {/* Custom Description */}
                {pkg.customDescription && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                    {pkg.customDescription}
                  </p>
                )}

                {/* Discount Period */}
                {pkg.discountEndsAt && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                    <Calendar className="size-3" />
                    Đến: {new Date(pkg.discountEndsAt).toLocaleDateString("vi-VN")}
                  </div>
                )}

                {/* Admin Note */}
                {pkg.adminNote && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                    {pkg.adminNote}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => startEdit(pkg)}
                  >
                    <Pencil className="size-3.5 mr-1.5" />
                    Chỉnh sửa
                  </Button>
                  {pkg.customLabel || pkg.discountPercent > 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReset(pkg.packageType)}
                      className="text-slate-500"
                    >
                      <RefreshCw className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="flex items-start gap-3 pt-4">
          <Info className="size-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold">Cách thức hoạt động:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-blue-700">
              <li>Kéo thanh % giảm giá để tự động tính giá mới</li>
              <li>Có thể đặt ngày bắt đầu/kết thúc cho chương trình giảm giá</li>
              <li>Thay đổi sẽ được áp dụng ngay trên landing page</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Edit Card Component ─────────────────────────────────────────────────────

interface EditCardProps {
  pkg: PricingData;
  onChange: (pkg: PricingData) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

function EditCard({ pkg, onChange, onSave, onCancel, saving }: EditCardProps) {
  const calculatedPrice =
    pkg.discountPercent > 0
      ? Math.round(pkg.basePrice * (1 - pkg.discountPercent / 100))
      : pkg.basePrice;

  return (
    <Card className="ring-2 ring-indigo-500 bg-gradient-to-br from-white to-indigo-50/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="size-4 text-indigo-600" />
              Chỉnh sửa: {PACKAGE_LABELS[pkg.packageType]}
            </CardTitle>
            <CardDescription className="text-xs">
              Kéo thanh để điều chỉnh % giảm giá
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
            <X className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Price Summary */}
        <div className="p-4 bg-white rounded-xl border space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Giá gốc:</span>
            <span className="font-bold">{formatPrice(pkg.basePrice)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Sau giảm:</span>
            <span className="font-black text-indigo-600 text-lg">
              {formatPrice(calculatedPrice)}
            </span>
          </div>
        </div>

        {/* Discount Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Phần trăm giảm giá</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                value={pkg.discountPercent}
                onChange={(e) =>
                  onChange({
                    ...pkg,
                    discountPercent: Math.min(
                      100,
                      Math.max(0, parseInt(e.target.value) || 0),
                    ),
                  })
                }
                className="w-20 text-center font-bold"
              />
              <span className="text-slate-500">%</span>
            </div>
          </div>
          <Slider
            value={[pkg.discountPercent]}
            onValueChange={([value]) =>
              onChange({ ...pkg, discountPercent: value })
            }
            max={100}
            min={0}
            step={5}
          />
          <div className="flex justify-between text-xs text-slate-400 px-1">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Custom Label & Description */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Nhãn tùy chỉnh</Label>
            <Input
              value={pkg.customLabel ?? ""}
              onChange={(e) =>
                onChange({ ...pkg, customLabel: e.target.value || null })
              }
              placeholder="VD: Summer Sale"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Mô tả</Label>
            <Input
              value={pkg.customDescription ?? ""}
              onChange={(e) =>
                onChange({ ...pkg, customDescription: e.target.value || null })
              }
              placeholder="VD: Ưu đãi mùa hè"
            />
          </div>
        </div>

        {/* Discount Period */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Thời gian giảm giá (tùy chọn)</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="datetime-local"
              value={
                pkg.discountStartsAt
                  ? new Date(pkg.discountStartsAt).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                onChange({
                  ...pkg,
                  discountStartsAt: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                })
              }
              placeholder="Bắt đầu"
            />
            <Input
              type="datetime-local"
              value={
                pkg.discountEndsAt
                  ? new Date(pkg.discountEndsAt).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                onChange({
                  ...pkg,
                  discountEndsAt: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                })
              }
              placeholder="Kết thúc"
            />
          </div>
        </div>

        {/* Admin Note */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Ghi chú nội bộ</Label>
          <Input
            value={pkg.adminNote ?? ""}
            onChange={(e) =>
              onChange({ ...pkg, adminNote: e.target.value || null })
            }
            placeholder="VD: Áp dụng cho chiến dịch Tết 2025"
          />
        </div>

        {/* Enabled Toggle */}
        <div className="flex items-center justify-between p-3 border rounded-xl bg-white">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium cursor-pointer">
              Hiển thị gói này
            </Label>
            <p className="text-xs text-slate-500">
              Nếu tắt, gói sẽ không hiển thị trên trang pricing
            </p>
          </div>
          <Switch
            checked={pkg.isEnabled}
            onCheckedChange={(checked) =>
              onChange({ ...pkg, isEnabled: checked })
            }
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onCancel} disabled={saving} className="flex-1">
            Hủy
          </Button>
          <Button
            onClick={onSave}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 mr-1.5 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Check className="size-4 mr-1.5" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
