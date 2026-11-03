import { describe, expect, test } from "bun:test";
import { messageErreurYoutube, parseYoutube } from "../src/lib/youtube";

const ID = "dQw4w9WgXcQ";
describe("Liens YouTube", () => {
  test.each([
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?feature=share&v=${ID}`,
    `https://m.youtube.com/watch?v=${ID}&list=PL123`,
    `https://youtu.be/${ID}`,
    `https://youtu.be/${ID}?si=AbCdEf`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/live/${ID}?feature=share`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `youtube.com/watch?v=${ID}`,
  ])("reconnaît %s", (lien) => expect(parseYoutube(lien)?.id).toBe(ID));

  test("point de départ", () => {
    expect(parseYoutube(`https://youtu.be/${ID}?t=90`)?.start).toBe(90);
    expect(parseYoutube(`https://youtu.be/${ID}?t=1m30s`)?.start).toBe(90);
  });
  test.each(["", "https://vimeo.com/123", "https://evil.com/watch?v=" + ID, "https://youtube.com.evil.com/watch?v=" + ID, "https://youtu.be/court", "texte"])("refuse %s", (lien) =>
    expect(parseYoutube(lien)).toBeNull());
  test("messages d'erreur d'intégration interdite", () => {
    expect(messageErreurYoutube(101)).toContain("n’autorise pas");
    expect(messageErreurYoutube(150)).toBe(messageErreurYoutube(101));
  });
});
