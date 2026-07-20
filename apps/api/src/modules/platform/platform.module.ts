import { Module } from '@nestjs/common';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { SettingsModule } from './settings/settings.module';

/** Platform shared settings/flags — Phase 0 empty scaffolds only. */
@Module({
  imports: [FeatureFlagsModule, SettingsModule],
})
export class PlatformModule {}
