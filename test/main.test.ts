import * as cp from 'node:child_process';
import * as path from 'node:path';
import * as process from 'node:process';
import { expect, test } from 'vitest';
import { wait } from '../src/wait';

test('throws invalid number', async () => {
  const input = parseInt('foo', 10);
  await expect(wait(input)).rejects.toThrow('milliseconds not a number');
});

test('wait 500 ms', async () => {
  const start = new Date();
  await wait(500);
  const end = new Date();
  var delta = Math.abs(end.getTime() - start.getTime());
  expect(delta).toBeGreaterThan(450);
});

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
  const np = process.execPath;
  const ip = path.join(__dirname, '..', 'dist', 'index.js');
  const options: cp.ExecFileSyncOptions = {
    env: {
      ...process.env,
      GITHUB_EVENT_NAME: 'push',
      INPUT_PROVIDER: 'azuredevops',
      'INPUT_REPO-TOKEN': 'test-token',
    },
  };
  console.log(cp.execFileSync(np, [ip], options).toString());
});
