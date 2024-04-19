import { toHumanReadable, toTimecode } from './duration';

describe('duration', () => {
  test('toHumanReadable', async () => {
    const ONE_MINUTE = 60000;
    let humanDuration = toHumanReadable(ONE_MINUTE);
    expect(humanDuration).toEqual('1m');

    humanDuration = toHumanReadable(ONE_MINUTE * 60 + ONE_MINUTE);
    expect(humanDuration).toEqual('1h 1m');
  });

  test('toTimecode', async () => {
    const MORE_OR_LESS_ONE_MINUTE = '60.41545';
    let timecode = toTimecode(MORE_OR_LESS_ONE_MINUTE);
    expect(timecode).toEqual('00:01:00');

    const ONE_HOUR = '3600';
    timecode = toTimecode(ONE_HOUR);
    expect(timecode).toEqual('01:00:00');
  });
});
