import { invitationEmail, passwordResetEmail } from "./templates";

describe("mail templates", () => {
  const link = "https://news.example/staff/accept-invitation?token=abc123";

  it("invitation carries the link in both bodies and names the inviter", () => {
    const message = invitationEmail({
      to: "new@example.com",
      displayName: "Priya",
      invitedBy: "Marcus",
      link,
      expiresInDays: 7,
    });
    expect(message.to).toBe("new@example.com");
    expect(message.text).toContain(link);
    expect(message.html).toContain(link);
    expect(message.text).toContain("Marcus");
    expect(message.text).toContain("7 days");
  });

  it("escapes staff-entered text in the HTML body", () => {
    const message = invitationEmail({
      to: "x@example.com",
      displayName: '<img src=x onerror="alert(1)">',
      invitedBy: "Marcus & Co",
      link,
      expiresInDays: 7,
    });
    expect(message.html).not.toContain("<img src=x");
    expect(message.html).toContain("&lt;img src=x");
    expect(message.html).toContain("Marcus &amp; Co");
  });

  it("reset says how long the link lasts and never claims who asked", () => {
    const message = passwordResetEmail({ to: "x@example.com", link, expiresInMinutes: 60 });
    expect(message.text).toContain("60 minutes");
    expect(message.text).toContain(link);
    expect(message.text.toLowerCase()).toContain("if that wasn’t you");
  });
});
