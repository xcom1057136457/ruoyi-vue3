import router from './router';
import store from './store';
import { message } from 'ant-design-vue';
import { getToken } from '@/utils/auth';
import {
  NavigationGuardNext,
  RouteLocationNormalized,
  RouteRecordRaw
} from 'vue-router';

const whiteList: string[] = ['/login', '/auth-redirect', '/bind', '/register'];

router.beforeEach(
  (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    document.title = to.meta.title
      ? process.env.VUE_APP_WEBNAME + ' - ' + to.meta.title
      : process.env.VUE_APP_WEBNAME;
    if (getToken()) {
      if (to.path == '/login') {
        next({ path: '/' });
      } else {
        if (store.getters.roles.length === 0) {
          // 判断当前用户是否已拉取完user_info信息
          store
            .dispatch('GetInfo')
            .then(() => {
              store.dispatch('GenerateRoutes').then((accessRoutes) => {
                // 根据roles权限生成可访问的路由表
                accessRoutes.forEach((item: RouteRecordRaw) => {
                  if (item.path == '*') return;
                  router.addRoute(item); // 动态添加可访问路由表
                });

                next({ ...to, replace: true }); // hack方法 确保addRoutes已完成
              });
            })
            .catch((err) => {
              store.dispatch('LogOut').then(() => {
                message.error(err);
                next({ path: '/' });
              });
            });
        } else {
          next();
        }
      }
    } else {
      if (whiteList.indexOf(to.path) !== -1) {
        // 在免登录白名单，直接进入
        next();
      } else {
        next(`/login?redirect=${to.fullPath}`); // 否则全部重定向到登录页
      }
    }
  }
);
