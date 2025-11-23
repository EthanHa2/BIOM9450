import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  IconDna2,
  IconChartPieFilled,
  IconUsers,
  IconLogout,
  IconUserFilled,
} from "@tabler/icons-react";
import { Center, Stack, Tooltip } from "@mantine/core";
import NextImage from "next/image";
import logo from "@/assets/white_logo.png";

interface NavbarLinkProps {
  icon: typeof IconDna2;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NAVBAR_CLASSES =
  "w-20 min-h-screen p-4 flex flex-col bg-[var(--theme-primary)] text-white shadow-sm";
const NAVBAR_MAIN_CLASSES = "flex-1 flex flex-col justify-center";
const BASE_LINK_CLASSES =
  "w-12 h-12 rounded-md flex items-center justify-center transition-colors";
const INACTIVE_LINK_CLASSES =
  "text-white hover:[var(--theme-primary)] cursor-pointer";
const ACTIVE_LINK_CLASSES =
  "bg-white text-[var(--theme-primary)] shadow-sm cursor-default";

function getLinkClasses(isActive: boolean): string {
  if (isActive) {
    return `${BASE_LINK_CLASSES} ${ACTIVE_LINK_CLASSES}`;
  }

  return `${BASE_LINK_CLASSES} ${INACTIVE_LINK_CLASSES}`;
}

function NavbarLink({ icon: Icon, label, active, onClick }: NavbarLinkProps) {
  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
      <button
        onClick={onClick}
        className={getLinkClasses(Boolean(active))}
        data-active={active || undefined}
        type="button"
      >
        <Icon size={20} stroke={1.5} />
      </button>
    </Tooltip>
  );
}

const navItems = [
  { icon: IconUsers, label: "Patients", path: "/dashboard" },
  {
    icon: IconChartPieFilled,
    label: "Visualisations",
    path: "/dashboard/visualisations",
  },
  { icon: IconDna2, label: "Mutations", path: "/dashboard/mutations" },
];

export function DashboardNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const links = navItems.map((item) => (
    <NavbarLink
      {...item}
      key={item.label}
      active={pathname === item.path}
      onClick={() => router.push(item.path)}
    />
  ));

  return (
    <nav className={NAVBAR_CLASSES}>
      <Center>
        <NextImage src={logo} alt="Logo" width={50} height={50} priority />
      </Center>

      <div className={NAVBAR_MAIN_CLASSES}>
        <Stack justify="center" gap={5}>
          {links}
        </Stack>
      </div>

      <Stack justify="center" gap={5}>
        <NavbarLink icon={IconUserFilled} label="Clinician Profile" />
        <NavbarLink icon={IconLogout} label="Sign Out" onClick={logout} />
      </Stack>
    </nav>
  );
}
