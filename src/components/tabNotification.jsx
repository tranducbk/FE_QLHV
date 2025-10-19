import { IoMdNotificationsOutline } from "react-icons/io";

const TabNotification = ({ count }) => (
  <div className="relative">
    <IoMdNotificationsOutline className="size-8 hover:text-blue-600 hover:cursor-pointer" />
    {count > 0 && (
      <span className="absolute top-0 right-0 bg-red-500 text-white text-s rounded-full size-4  flex items-center justify-center">
        {count}
      </span>
    )}
  </div>
);

export default TabNotification;
