import { Module } from '@nestjs/common';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { SettingsModule } from './settings/settings.module';

/** Platform shared settings/flags. */
@Module({
  imports: [FeatureFlagsModule, SettingsModule],
  exports: [FeatureFlagsModule],
})
export class PlatformModule {}
