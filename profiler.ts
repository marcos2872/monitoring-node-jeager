import { writeFileSync } from 'node:fs';
import { Session } from 'node:inspector';

const session = new Session();
session.connect();
session.post('Profiler.enable', () => {
  session.post('Profiler.start', () => {
    setTimeout(() => {
      session.post('Profiler.stop', (err, { profile }) => {
        writeFileSync('./profile.cpuprofile', JSON.stringify(profile));

        session.disconnect();
      });
    }, 10000);
  });
});
