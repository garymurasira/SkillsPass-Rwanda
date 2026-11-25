import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

if (env.DEMO_MODE === 'true') {
  console.warn('DEMO_MODE is on: sign-in codes are returned to the web app. Turn it off after the demonstration.');
}

app.listen(env.PORT, () => {
  console.log(`SkillsPass API listening on port ${env.PORT} (${env.NODE_ENV})`);
});
