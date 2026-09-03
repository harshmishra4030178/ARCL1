"use client";

import NextLink from "next/link";
import { useRouter, usePathname, useParams as useNextParams, useSearchParams } from "next/navigation";
import React from "react";

export const Link = ({ to, href, children, state, reloadDocument, ...props }) => {
  const target = to || href || "#";
  return (
    <NextLink href={target} {...props}>
      {children}
    </NextLink>
  );
};

export const NavLink = ({
  to,
  href,
  className,
  children,
  end,
  caseSensitive,
  reloadDocument,
  state,
  ...props
}) => {
  const target = to || href || "#";
  const pathname = usePathname();
  const isActive = end
    ? pathname === target
    : pathname === target || (target !== "/" && pathname?.startsWith(target));
  const evaluatedClass =
    typeof className === "function" ? className({ isActive }) : className;

  return (
    <NextLink href={target} className={evaluatedClass} {...props}>
      {children}
    </NextLink>
  );
};

export const useNavigate = () => {
  const router = useRouter();
  return (path) => {
    if (typeof path === "number") {
      if (path === -1) window.history.back();
      return;
    }
    router.push(path);
  };
};

export const useParams = () => {
  const params = useNextParams();
  return params || {};
};

export const useLocation = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return {
    pathname: pathname || "/",
    search: searchParams ? `?${searchParams.toString()}` : "",
  };
};

export default Link;
