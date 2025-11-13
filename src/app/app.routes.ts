import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'products',
    loadComponent: () => import('./features/products/product-list/product-list.component').then(m => m.ProductListComponent)
  },
  {
    path: 'products/compare',
    loadComponent: () => import('./features/products/product-compare/product-compare.component').then(m => m.ProductCompareComponent)
  },
  {
    path: 'products/:slug',
    loadComponent: () => import('./features/products/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent),
    canActivate: [authGuard]
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./features/auth/callback/callback.component').then(m => m.AuthCallbackComponent)
  },
  {
    path: 'legal/privacy',
    loadComponent: () => import('./features/legal/privacy/privacy.component').then(m => m.PrivacyComponent)
  },
  {
    path: 'legal/terms',
    loadComponent: () => import('./features/legal/terms/terms.component').then(m => m.TermsComponent)
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () => import('./features/account/account-layout/account-layout.component').then(m => m.AccountLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/account/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/account/orders/orders.component').then(m => m.OrdersComponent)
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./features/account/order-detail/order-detail.component').then(m => m.OrderDetailComponent)
      },
      {
        path: 'wishlist',
        loadComponent: () => import('./features/account/wishlist/wishlist.component').then(m => m.WishlistComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/account/settings/settings.component').then(m => m.SettingsComponent)
      },
      {
        path: 'addresses',
        loadComponent: () => import('./features/account/addresses/addresses.component').then(m => m.AddressesComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/account/notifications/notifications-page.component').then(m => m.NotificationsPageComponent)
      }
    ]
  },
    {
      path: 'admin',
      canActivate: [adminGuard],
      loadComponent: () => import('./features/admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
      children: [
        {
          path: '',
          redirectTo: 'dashboard',
          pathMatch: 'full'
        },
        {
          path: 'dashboard',
          loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent)
        },
        {
          path: 'products',
          loadComponent: () => import('./features/admin/products/products.component').then(m => m.AdminProductsComponent)
        },
        {
          path: 'products/:id',
          loadComponent: () => import('./features/admin/product-detail/product-detail.component').then(m => m.AdminProductDetailComponent)
        },
        {
          path: 'categories',
          loadComponent: () => import('./features/admin/categories/categories.component').then(m => m.AdminCategoriesComponent)
        },
        {
          path: 'orders',
          loadComponent: () => import('./features/admin/orders/orders.component').then(m => m.AdminOrdersComponent)
        },
        {
          path: 'orders/:id',
          loadComponent: () => import('./features/admin/order-detail/order-detail.component').then(m => m.AdminOrderDetailComponent)
        },
        {
          path: 'customers',
          loadComponent: () => import('./features/admin/customers/customers.component').then(m => m.AdminCustomersComponent)
        },
        {
          path: 'coupons',
          loadComponent: () => import('./features/admin/coupons/coupons.component').then(m => m.AdminCouponsComponent)
        },
        {
          path: 'reviews',
          loadComponent: () => import('./features/admin/reviews/reviews.component').then(m => m.AdminReviewsComponent)
        },
        {
          path: 'shipping',
          loadComponent: () => import('./features/admin/shipping/shipping.component').then(m => m.AdminShippingComponent)
        },
        {
          path: 'addresses',
          loadComponent: () => import('./features/admin/addresses/addresses.component').then(m => m.AdminAddressesComponent)
        }
      ]
    },
  {
    path: '**',
    redirectTo: ''
  }
];
