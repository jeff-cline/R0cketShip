import type { Metadata } from "next";
import { getYellowAuth, countYellowUsers } from "@/src/yellow/auth";
import { loadPages, loadAllUsers } from "@/src/yellow/data";
import { YellowAuthScreen } from "./YellowAuthScreen";
import { YellowApp } from "./YellowApp";

export const dynamic = "force-dynamic";

const ROCKET_FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext x='50' y='54' font-size='76' text-anchor='middle' dominant-baseline='central'%3E%F0%9F%9A%80%3C/text%3E%3C/svg%3E";

export const metadata: Metadata = {
  title: "🚀 Yellow · R0cketShip",
  robots: { index: false, follow: false },
  icons: { icon: ROCKET_FAVICON },
};

export default async function YellowPage() {
  const auth = await getYellowAuth();

  if (!auth) {
    const first = (await countYellowUsers()) === 0;
    return <YellowAuthScreen mode={first ? "setup" : "login"} />;
  }
  if (auth.user.mustReset && !auth.impersonatorUserId) {
    return <YellowAuthScreen mode="reset" name={auth.user.name} />;
  }

  const isRealAdmin = auth.user.isAdmin && !auth.impersonatorUserId;
  const [pages, users] = await Promise.all([
    loadPages(auth.user.id),
    isRealAdmin ? loadAllUsers() : Promise.resolve([]),
  ]);

  return (
    <YellowApp
      key={auth.user.id}
      me={{ id: auth.user.id, name: auth.user.name, username: auth.user.username, isAdmin: auth.user.isAdmin }}
      impersonating={Boolean(auth.impersonatorUserId)}
      isAdmin={isRealAdmin}
      pages={pages}
      users={users}
    />
  );
}
