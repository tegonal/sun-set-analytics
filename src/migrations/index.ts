import * as migration_20250410_060450 from './20250410_060450';

export const migrations = [
  {
    up: migration_20250410_060450.up,
    down: migration_20250410_060450.down,
    name: '20250410_060450'
  },
];
