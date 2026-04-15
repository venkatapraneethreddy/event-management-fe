import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';

export class NoReuseStrategy implements RouteReuseStrategy {
  shouldDetach(_route: ActivatedRouteSnapshot): boolean { return false; }
  store(_route: ActivatedRouteSnapshot, _handle: DetachedRouteHandle | null): void {}
  shouldAttach(_route: ActivatedRouteSnapshot): boolean { return false; }
  retrieve(_route: ActivatedRouteSnapshot): DetachedRouteHandle | null { return null; }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    // Reuse layout/parent routes that have children (StudentLayout, OrganizerLayout, AdminLayout)
    // Only destroy+recreate the actual page components (leaf routes with no children)
    if (future.routeConfig === curr.routeConfig) {
      const hasChildren = (future.routeConfig?.children?.length ?? 0) > 0;
      return hasChildren;
    }
    return false;
  }
}
