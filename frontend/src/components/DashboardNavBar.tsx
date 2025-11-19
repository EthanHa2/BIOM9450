import { useState } from "react";
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
const NAVBAR_MAIN_CLASSES = "flex-1 mt-12";
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

const mockdata = [
  { icon: IconUsers, label: "Patients" },
  { icon: IconChartPieFilled, label: "Visualisations" },
  { icon: IconDna2, label: "Mutations" },
];

export function DashboardNavBar() {
  const [active, setActive] = useState(2);

  const links = mockdata.map((link, index) => (
    <NavbarLink
      {...link}
      key={link.label}
      active={index === active}
      onClick={() => setActive(index)}
    />
  ));

  return (
    <nav className={NAVBAR_CLASSES}>
      <Center>
        <NextImage src={logo} alt="Logo" width={50} height={50} priority />
      </Center>

      <div className={NAVBAR_MAIN_CLASSES}>
        <Stack justify="center" gap={0}>
          {links}
        </Stack>
      </div>

      <Stack justify="center" gap={0}>
        <NavbarLink icon={IconUserFilled} label="Clinician Profile" />
        <NavbarLink icon={IconLogout} label="Sign Out" />
      </Stack>
    </nav>
  );
}
