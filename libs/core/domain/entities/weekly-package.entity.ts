import { WeeklyPackageItem } from './weekly-package-item.entity';

export class WeeklyPackage {
  id: string;
  weekIdentifier: string;
  name: string;
  description?: string;
  discountPercentage: number;
  items?: WeeklyPackageItem[];
}
