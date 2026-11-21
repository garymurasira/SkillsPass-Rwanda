import { useState } from "react";
import { provinces } from "@/lib/locations";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  /** Uncontrolled use: starting values only. */
  defaultProvince?: string;
  defaultDistrict?: string;
  /** Controlled use: pass all three. Changing the province clears the district. */
  province?: string;
  district?: string;
  onChange?: (province: string, district: string) => void;
  errors?: { province?: string | undefined; district?: string | undefined };
};

export function LocationSelect({ defaultProvince, defaultDistrict, province, district, onChange, errors }: Props) {
  const controlled = onChange !== undefined;
  const [innerProv, setInnerProv] = useState(defaultProvince ?? "");
  const prov = controlled ? (province ?? "") : innerProv;
  const districts = provinces.find((p) => p.name === prov)?.districts ?? [];

  const pickProvince = (p: string) => {
    if (controlled) onChange(p, "");
    else setInnerProv(p);
  };

  return (
    <>
      <div className="space-y-2">
        <Label className="text-base">Province</Label>
        <Select value={prov} onValueChange={pickProvince}>
          <SelectTrigger className="h-12 text-base" aria-invalid={errors?.province ? true : undefined}>
            <SelectValue placeholder="Choose province" />
          </SelectTrigger>
          <SelectContent>{provinces.map((p) => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
        {errors?.province && <p role="alert" className="text-sm font-bold text-destructive">{errors.province}</p>}
      </div>
      <div className="space-y-2">
        <Label className="text-base">District</Label>
        <Select
          key={prov}
          {...(controlled
            ? { value: district ?? "", onValueChange: (d: string) => onChange(prov, d) }
            : prov === defaultProvince && defaultDistrict ? { defaultValue: defaultDistrict } : {})}
          disabled={!prov}
        >
          <SelectTrigger className="h-12 text-base" aria-invalid={errors?.district ? true : undefined}>
            <SelectValue placeholder="Choose district" />
          </SelectTrigger>
          <SelectContent>{districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
        {errors?.district && <p role="alert" className="text-sm font-bold text-destructive">{errors.district}</p>}
      </div>
    </>
  );
}
