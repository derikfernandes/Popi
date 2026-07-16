import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type MouseEvent,
  type AnchorHTMLAttributes,
} from "react";

export interface Location {
  pathname: string;
  search: string;
  hash: string;
}

interface NavigateOptions {
  replace?: boolean;
}

interface RouterContextValue {
  location: Location;
  navigate: (to: string, options?: NavigateOptions) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);
const ParamsContext = createContext<Record<string, string>>({});
const OutletContext = createContext<ReactNode>(null);

function readLocation(): Location {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
  };
}

export function normalizePath(path: string): string {
  if (!path) return "/";
  const bare = path.split("?")[0].split("#")[0];
  if (bare.length > 1 && bare.endsWith("/")) return bare.slice(0, -1);
  return bare || "/";
}

export function matchPath(
  pattern: string,
  pathname: string
): Record<string, string> | null {
  const normPattern = normalizePath(pattern);
  const normPath = normalizePath(pathname);

  if (normPattern === "*") return {};

  const patternParts = normPattern.split("/").filter(Boolean);
  const pathParts = normPath.split("/").filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const part = patternParts[i];
    if (part.startsWith(":")) {
      params[part.slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (part !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

export function BrowserRouter({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location>(readLocation);

  useEffect(() => {
    const onPopState = () => setLocation(readLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((to: string, options?: NavigateOptions) => {
    const url = to.startsWith("/") ? to : `/${to}`;
    if (options?.replace) {
      window.history.replaceState(null, "", url);
    } else {
      window.history.pushState(null, "", url);
    }
    setLocation(readLocation());
  }, []);

  const value = useMemo(() => ({ location, navigate }), [location, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

function useRouterContext(): RouterContextValue {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error("Componentes de rota devem estar dentro de <BrowserRouter>.");
  }
  return ctx;
}

export function useNavigate() {
  return useRouterContext().navigate;
}

export function useLocation(): Location {
  return useRouterContext().location;
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  return useContext(ParamsContext) as T;
}

export function Navigate({ to, replace = false }: { to: string; replace?: boolean }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, to, replace]);
  return null;
}

interface RouteConfig {
  path: string;
  element: ReactNode;
  layout?: ReactNode;
}

interface RoutesProps {
  children: ReactNode;
}

/**
 * Flat route table. Use path patterns like `/mapeamento/:popiId`.
 * Nested layout: wrap page element with the layout component yourself,
 * or pass a layout route via <Route path="..." element={<Layout />}> with Outlet children
 * — for simplicity we support flat routes and optional nested Route children rendered via Outlet.
 */
export function Routes({ children }: RoutesProps) {
  const { location } = useRouterContext();
  const entries = useMemo(() => flattenRoutes(children), [children]);

  const matched = useMemo(() => {
    // Prefer literal segments over params (ex.: /mapeamento/novo > /mapeamento/:popiId)
    const scored = entries
      .map((entry) => {
        const params = matchPath(entry.fullPath, location.pathname);
        if (!params) return null;
        const specificity =
          entry.fullPath === "*"
            ? 0
            : entry.fullPath
                .split("/")
                .filter(Boolean)
                .reduce((sum, part) => sum + (part.startsWith(":") ? 1 : 10), 0);
        return { entry, params, specificity };
      })
      .filter(Boolean) as Array<{
      entry: FlatRoute;
      params: Record<string, string>;
      specificity: number;
    }>;

    scored.sort((a, b) => b.specificity - a.specificity);
    return scored[0] ?? null;
  }, [entries, location.pathname]);

  if (!matched) return null;

  const { entry, params } = matched;
  let node: ReactNode = entry.element;

  // Wrap with parent layouts from root to leaf (excluding the leaf itself)
  for (let i = entry.layouts.length - 1; i >= 0; i--) {
    const layoutElement = entry.layouts[i];
    node = (
      <OutletContext.Provider value={node}>
        {layoutElement}
      </OutletContext.Provider>
    );
  }

  return <ParamsContext.Provider value={params}>{node}</ParamsContext.Provider>;
}

interface FlatRoute {
  fullPath: string;
  element: ReactNode;
  layouts: ReactNode[];
}

interface RouteProps {
  path?: string;
  index?: boolean;
  element?: ReactNode;
  children?: ReactNode;
}

export function Route(_props: RouteProps) {
  return null;
}

function flattenRoutes(
  children: ReactNode,
  parentPath = "",
  layouts: ReactNode[] = []
): FlatRoute[] {
  const result: FlatRoute[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type !== Route) return;

    const props = child.props as RouteProps;

    if (props.path === "*") {
      if (props.element !== undefined) {
        result.push({
          fullPath: "*",
          element: props.element,
          layouts: [...layouts],
        });
      }
      return;
    }

    const segment = props.index ? "" : props.path ?? "";
    const fullPath = joinPath(parentPath, segment);

    const hasChildRoutes =
      props.children &&
      React.Children.toArray(props.children).some(
        (c) => React.isValidElement(c) && c.type === Route
      );

    if (hasChildRoutes) {
      const nextLayouts = props.element
        ? [...layouts, props.element]
        : layouts;
      result.push(
        ...flattenRoutes(props.children, fullPath || "/", nextLayouts)
      );

      // Allow matching the layout path itself if an index route exists
      return;
    }

    if (props.element !== undefined) {
      result.push({
        fullPath: fullPath || "/",
        element: props.element,
        layouts: [...layouts],
      });
    }
  });

  return result;
}

function joinPath(parent: string, child: string): string {
  if (!child) return normalizePath(parent || "/");
  if (child.startsWith("/")) return normalizePath(child);
  const base = parent === "/" ? "" : normalizePath(parent);
  return normalizePath(`${base}/${child}`);
}

export function Outlet() {
  return <>{useContext(OutletContext)}</>;
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  replace?: boolean;
};

export function Link({ to, replace, onClick, children, ...rest }: LinkProps) {
  const navigate = useNavigate();
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.altKey ||
      e.ctrlKey ||
      e.shiftKey
    ) {
      return;
    }
    e.preventDefault();
    navigate(to, { replace });
  };

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

type NavLinkClassName =
  | string
  | ((args: { isActive: boolean }) => string | undefined);

type NavLinkProps = Omit<LinkProps, "className"> & {
  className?: NavLinkClassName;
  end?: boolean;
};

export function NavLink({ to, className, end = false, children, ...rest }: NavLinkProps) {
  const { location } = useRouterContext();
  const current = normalizePath(location.pathname);
  const target = normalizePath(to);
  const isActive = end
    ? current === target
    : current === target || current.startsWith(`${target}/`);

  const resolved =
    typeof className === "function" ? className({ isActive }) : className;

  return (
    <Link to={to} className={resolved} {...rest}>
      {children}
    </Link>
  );
}
