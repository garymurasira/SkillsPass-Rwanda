import { useState } from "react";
import { provinces } from "@/mock/locations";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LocationSelect({ defaultProvince, defaultDistrict }: { defaultProvince?: string; defaultDistrict?: string }) {
  const [prov, setProv] = useState(defaultProvince ?? "");
  const districts = provinces.find((p) => p.name === prov)?.districts ?? [];
  return (
    <>
      <div className="space-y-2">
        <Label className="text-base">Province</Label>
        <Select value={prov} onValueChange={setProv}>
          <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Choose province" /></SelectTrigger>
          <SelectContent>{provinces.map((p) => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-base">District</Label>
        <Select key={prov} {...(prov === defaultProvince && defaultDistrict ? { defaultValue: defaultDistrict } : {})} disabled={!prov}>
          <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Choose district" /></SelectTrigger>
          <SelectContent>{districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </>
  );
}
