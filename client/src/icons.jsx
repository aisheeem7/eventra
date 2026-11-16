// EvenTra icon set — Phosphor duotone icons exposed under the names the pages already use.
// Pages import from '../icons.jsx'; swap the mapping here to restyle every icon at once.
import {
  ArrowCounterClockwise as ArrowCounterClockwiseIcon, ArrowLeft as ArrowLeftIcon, CalendarCheck as CalendarCheckIcon, CalendarDots as CalendarDotsIcon, CalendarPlus as CalendarPlusIcon, Camera as CameraIcon, CameraSlash as CameraSlashIcon, CaretRight as CaretRightIcon, Certificate as CertificateIcon, ChartBar as ChartBarIcon, Check as CheckIcon, CheckCircle as CheckCircleIcon, ClipboardText as ClipboardTextIcon, Clock as ClockIcon, Copy as CopyIcon, CurrencyInr as CurrencyInrIcon, DeviceMobile as DeviceMobileIcon, DownloadSimple as DownloadSimpleIcon, House as HouseIcon, ImageSquare as ImageSquareIcon, Keyboard as KeyboardIcon, LinkSimple as LinkSimpleIcon, MagnifyingGlass as MagnifyingGlassIcon, MapPin as MapPinIcon, Medal as MedalIcon, PencilSimple as PencilSimpleIcon, Printer as PrinterIcon, QrCode as QrCodeIcon, Scan as ScanIcon, SealCheck as SealCheckIcon, ShareNetwork as ShareNetworkIcon, ShieldCheck as ShieldCheckIcon, ShieldSlash as ShieldSlashIcon, ShieldWarning as ShieldWarningIcon, SignOut as SignOutIcon, SquaresFour as SquaresFourIcon, Ticket as TicketIcon, User as UserIcon, UserCheck as UserCheckIcon, Users as UsersIcon, Warning as WarningIcon, X as XIcon, XCircle as XCircleIcon, ChartDonut as ChartDonutIcon, SidebarSimple as SidebarSimpleIcon, Trash as TrashIcon, UploadSimple as UploadSimpleIcon, MinusCircle as MinusCircleIcon, Info as InfoIcon,
} from '@phosphor-icons/react';

const wrap = (Icon) => {
  const C = ({ strokeWidth, size = 24, weight, ...rest }) => (
    <Icon size={size} weight={weight || (strokeWidth >= 2.4 ? 'bold' : 'duotone')} {...rest} />
  );
  return C;
};

export const AlertTriangle = wrap(WarningIcon);
export const ArrowLeft = wrap(ArrowLeftIcon);
export const Award = wrap(MedalIcon);
export const BadgeCheck = wrap(SealCheckIcon);
export const BarChart3 = wrap(ChartBarIcon);
export const CalendarDays = wrap(CalendarDotsIcon);
export const CalendarPlus = wrap(CalendarPlusIcon);
export const CalendarSearch = wrap(CalendarCheckIcon);
export const Camera = wrap(CameraIcon);
export const CameraOff = wrap(CameraSlashIcon);
export const Check = wrap(CheckIcon);
export const CheckCircle2 = wrap(CheckCircleIcon);
export const ChevronRight = wrap(CaretRightIcon);
export const ClipboardList = wrap(ClipboardTextIcon);
export const Clock = wrap(ClockIcon);
export const Clock3 = wrap(ClockIcon);
export const Copy = wrap(CopyIcon);
export const Download = wrap(DownloadSimpleIcon);
export const FileBadge = wrap(CertificateIcon);
export const Home = wrap(HouseIcon);
export const ImageUp = wrap(ImageSquareIcon);
export const IndianRupee = wrap(CurrencyInrIcon);
export const Keyboard = wrap(KeyboardIcon);
export const LayoutDashboard = wrap(SquaresFourIcon);
export const Link2 = wrap(LinkSimpleIcon);
export const LogOut = wrap(SignOutIcon);
export const MapPin = wrap(MapPinIcon);
export const Pencil = wrap(PencilSimpleIcon);
export const Printer = wrap(PrinterIcon);
export const QrCode = wrap(QrCodeIcon);
export const RotateCcw = wrap(ArrowCounterClockwiseIcon);
export const ScanLine = wrap(ScanIcon);
export const Search = wrap(MagnifyingGlassIcon);
export const Share2 = wrap(ShareNetworkIcon);
export const ShieldAlert = wrap(ShieldWarningIcon);
export const ShieldCheck = wrap(ShieldCheckIcon);
export const ShieldX = wrap(ShieldSlashIcon);
export const Smartphone = wrap(DeviceMobileIcon);
export const Ticket = wrap(TicketIcon);
export const User = wrap(UserIcon);
export const UserCheck = wrap(UserCheckIcon);
export const Users = wrap(UsersIcon);
export const X = wrap(XIcon);
export const XCircle = wrap(XCircleIcon);
export const Attendance = wrap(ChartDonutIcon);
export const SidebarToggle = wrap(SidebarSimpleIcon);
export const Trash = wrap(TrashIcon);
export const Upload = wrap(UploadSimpleIcon);
export const MinusCircle = wrap(MinusCircleIcon);
export const Info = wrap(InfoIcon);
