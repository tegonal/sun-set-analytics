/* tslint:disable */
/* eslint-disable */
/**
 * This file was automatically generated by Payload.
 * DO NOT MODIFY IT BY HAND. Instead, modify your source Payload config,
 * and re-run `payload generate:types` to regenerate this file.
 */

/**
 * Supported timezones in IANA format.
 *
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "supportedTimezones".
 */
export type SupportedTimezones =
  | 'Pacific/Midway'
  | 'Pacific/Niue'
  | 'Pacific/Honolulu'
  | 'Pacific/Rarotonga'
  | 'America/Anchorage'
  | 'Pacific/Gambier'
  | 'America/Los_Angeles'
  | 'America/Tijuana'
  | 'America/Denver'
  | 'America/Phoenix'
  | 'America/Chicago'
  | 'America/Guatemala'
  | 'America/New_York'
  | 'America/Bogota'
  | 'America/Caracas'
  | 'America/Santiago'
  | 'America/Buenos_Aires'
  | 'America/Sao_Paulo'
  | 'Atlantic/South_Georgia'
  | 'Atlantic/Azores'
  | 'Atlantic/Cape_Verde'
  | 'Europe/London'
  | 'Europe/Berlin'
  | 'Africa/Lagos'
  | 'Europe/Athens'
  | 'Africa/Cairo'
  | 'Europe/Moscow'
  | 'Asia/Riyadh'
  | 'Asia/Dubai'
  | 'Asia/Baku'
  | 'Asia/Karachi'
  | 'Asia/Tashkent'
  | 'Asia/Calcutta'
  | 'Asia/Dhaka'
  | 'Asia/Almaty'
  | 'Asia/Jakarta'
  | 'Asia/Bangkok'
  | 'Asia/Shanghai'
  | 'Asia/Singapore'
  | 'Asia/Tokyo'
  | 'Asia/Seoul'
  | 'Australia/Brisbane'
  | 'Australia/Sydney'
  | 'Pacific/Guam'
  | 'Pacific/Noumea'
  | 'Pacific/Auckland'
  | 'Pacific/Fiji';

export interface Config {
  auth: {
    users: UserAuthOperations;
    pv_production: PvProductionAuthOperations;
  };
  blocks: {};
  collections: {
    users: User;
    installations: Installation;
    pv_production: PvProduction;
    pv_production_monthly_stats: PvProductionMonthlyStat;
    'payload-locked-documents': PayloadLockedDocument;
    'payload-preferences': PayloadPreference;
    'payload-migrations': PayloadMigration;
  };
  collectionsJoins: {
    users: {
      installations: 'installations';
    };
  };
  collectionsSelect: {
    users: UsersSelect<false> | UsersSelect<true>;
    installations: InstallationsSelect<false> | InstallationsSelect<true>;
    pv_production: PvProductionSelect<false> | PvProductionSelect<true>;
    pv_production_monthly_stats: PvProductionMonthlyStatsSelect<false> | PvProductionMonthlyStatsSelect<true>;
    'payload-locked-documents': PayloadLockedDocumentsSelect<false> | PayloadLockedDocumentsSelect<true>;
    'payload-preferences': PayloadPreferencesSelect<false> | PayloadPreferencesSelect<true>;
    'payload-migrations': PayloadMigrationsSelect<false> | PayloadMigrationsSelect<true>;
  };
  db: {
    defaultIDType: number;
  };
  globals: {};
  globalsSelect: {};
  locale: null;
  user:
    | (User & {
        collection: 'users';
      })
    | (PvProduction & {
        collection: 'pv_production';
      });
  jobs: {
    tasks: unknown;
    workflows: unknown;
  };
}
export interface UserAuthOperations {
  forgotPassword: {
    email: string;
    password: string;
  };
  login: {
    email: string;
    password: string;
  };
  registerFirstUser: {
    email: string;
    password: string;
  };
  unlock: {
    email: string;
    password: string;
  };
}
export interface PvProductionAuthOperations {
  forgotPassword: {
    email: string;
    password: string;
  };
  login: {
    email: string;
    password: string;
  };
  registerFirstUser: {
    email: string;
    password: string;
  };
  unlock: {
    email: string;
    password: string;
  };
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "users".
 */
export interface User {
  id: number;
  installations?: {
    docs?: (number | Installation)[];
    hasNextPage?: boolean;
    totalDocs?: number;
  };
  role?: ('admin' | 'user') | null;
  updatedAt: string;
  createdAt: string;
  enableAPIKey?: boolean | null;
  apiKey?: string | null;
  apiKeyIndex?: string | null;
  email: string;
  resetPasswordToken?: string | null;
  resetPasswordExpiration?: string | null;
  salt?: string | null;
  hash?: string | null;
  loginAttempts?: number | null;
  lockUntil?: string | null;
  password?: string | null;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "installations".
 */
export interface Installation {
  id: number;
  owner: number | User;
  name?: string | null;
  /**
   * @minItems 2
   * @maxItems 2
   */
  location?: [number, number] | null;
  panels?:
    | {
        /**
         * This is the power that the manufacturer declares that the PV array can produce under standard test conditions, which are a constant 1000W of solar irradiance per square meter in the plane of the array, at an array temperature of 25°C. The peak power should be entered in kilowatt-peak (kWp). If you do not know the declared peak power of your modules but instead know the area of the modules (in m2) and the declared conversion efficiency (in percent), you can calculate the peak power as power (kWp) = 1 kW/m2 * area * efficiency / 100.
         */
        peak_power?: number | null;
        /**
         * This is the angle of the PV modules from the horizontal plane, for a fixed (non-tracking) mounting.
         */
        slope?: number | null;
        /**
         * The azimuth, or orientation, is the angle of the PV modules relative to the direction due South. -90° is East, 0° is South and 90° is West.
         */
        azimuth?: number | null;
        /**
         * The estimated system losses are all the losses in the system, which cause the power actually delivered to the electricity grid to be lower than the power produced by the PV modules. There are several causes for this loss, such as losses in cables, power inverters, dirt (sometimes snow) on the modules and so on. Over the years the modules also tend to lose a bit of their power, so the average yearly output over the lifetime of the system will be a few percent lower than the output in the first years.
         */
        system_loss?: number | null;
        id?: string | null;
      }[]
    | null;
  PVGIS_config?: {
    enabled?: boolean | null;
    radiation_database?: ('PVGIS-SARAH3' | 'PVGIS-ERA5') | null;
    mounting_type?: ('0' | '3' | '5' | '2') | null;
    pv_technology?: ('crystSi' | 'CIS' | 'CdTe') | null;
  };
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "pv_production".
 */
export interface PvProduction {
  id: number;
  owner: number | User;
  installation?: (number | null) | Installation;
  from?: string | null;
  to?: string | null;
  energy?: {
    /**
     * Energy produced in kWh
     */
    measured_production?: number | null;
    /**
     * Estimated production data in kWh for the given location and within the provided time window
     */
    estimated_production?: number | null;
    /**
     * Estimated loss of pv production data due to weather conditions as percentage (0-100%)
     */
    estimated_loss?: number | null;
  };
  updatedAt: string;
  createdAt: string;
  enableAPIKey?: boolean | null;
  apiKey?: string | null;
  apiKeyIndex?: string | null;
  email: string;
  resetPasswordToken?: string | null;
  resetPasswordExpiration?: string | null;
  salt?: string | null;
  hash?: string | null;
  loginAttempts?: number | null;
  lockUntil?: string | null;
  password?: string | null;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "pv_production_monthly_stats".
 */
export interface PvProductionMonthlyStat {
  id: number;
  installation?: (number | null) | Installation;
  year?: number | null;
  month?: number | null;
  energy?: {
    /**
     * measured production data kWh
     */
    measured_production?: number | null;
    /**
     * normalized estimated production data kWh
     */
    estimated_production?: number | null;
  };
  owner: number | User;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-locked-documents".
 */
export interface PayloadLockedDocument {
  id: number;
  document?:
    | ({
        relationTo: 'users';
        value: number | User;
      } | null)
    | ({
        relationTo: 'installations';
        value: number | Installation;
      } | null)
    | ({
        relationTo: 'pv_production';
        value: number | PvProduction;
      } | null)
    | ({
        relationTo: 'pv_production_monthly_stats';
        value: number | PvProductionMonthlyStat;
      } | null);
  globalSlug?: string | null;
  user:
    | {
        relationTo: 'users';
        value: number | User;
      }
    | {
        relationTo: 'pv_production';
        value: number | PvProduction;
      };
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-preferences".
 */
export interface PayloadPreference {
  id: number;
  user:
    | {
        relationTo: 'users';
        value: number | User;
      }
    | {
        relationTo: 'pv_production';
        value: number | PvProduction;
      };
  key?: string | null;
  value?:
    | {
        [k: string]: unknown;
      }
    | unknown[]
    | string
    | number
    | boolean
    | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-migrations".
 */
export interface PayloadMigration {
  id: number;
  name?: string | null;
  batch?: number | null;
  updatedAt: string;
  createdAt: string;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "users_select".
 */
export interface UsersSelect<T extends boolean = true> {
  installations?: T;
  role?: T;
  updatedAt?: T;
  createdAt?: T;
  enableAPIKey?: T;
  apiKey?: T;
  apiKeyIndex?: T;
  email?: T;
  resetPasswordToken?: T;
  resetPasswordExpiration?: T;
  salt?: T;
  hash?: T;
  loginAttempts?: T;
  lockUntil?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "installations_select".
 */
export interface InstallationsSelect<T extends boolean = true> {
  owner?: T;
  name?: T;
  location?: T;
  panels?:
    | T
    | {
        peak_power?: T;
        slope?: T;
        azimuth?: T;
        system_loss?: T;
        id?: T;
      };
  PVGIS_config?:
    | T
    | {
        enabled?: T;
        radiation_database?: T;
        mounting_type?: T;
        pv_technology?: T;
      };
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "pv_production_select".
 */
export interface PvProductionSelect<T extends boolean = true> {
  owner?: T;
  installation?: T;
  from?: T;
  to?: T;
  energy?:
    | T
    | {
        measured_production?: T;
        estimated_production?: T;
        estimated_loss?: T;
      };
  updatedAt?: T;
  createdAt?: T;
  enableAPIKey?: T;
  apiKey?: T;
  apiKeyIndex?: T;
  email?: T;
  resetPasswordToken?: T;
  resetPasswordExpiration?: T;
  salt?: T;
  hash?: T;
  loginAttempts?: T;
  lockUntil?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "pv_production_monthly_stats_select".
 */
export interface PvProductionMonthlyStatsSelect<T extends boolean = true> {
  installation?: T;
  year?: T;
  month?: T;
  energy?:
    | T
    | {
        measured_production?: T;
        estimated_production?: T;
      };
  owner?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-locked-documents_select".
 */
export interface PayloadLockedDocumentsSelect<T extends boolean = true> {
  document?: T;
  globalSlug?: T;
  user?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-preferences_select".
 */
export interface PayloadPreferencesSelect<T extends boolean = true> {
  user?: T;
  key?: T;
  value?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "payload-migrations_select".
 */
export interface PayloadMigrationsSelect<T extends boolean = true> {
  name?: T;
  batch?: T;
  updatedAt?: T;
  createdAt?: T;
}
/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "auth".
 */
export interface Auth {
  [k: string]: unknown;
}


declare module 'payload' {
  export interface GeneratedTypes extends Config {}
}