<template>
  <a-layout class="menu_layout" style="min-height: 100vh;">
    <a-layout-sider theme="light" v-model:collapsed="collapsed" collapsible>
      <div class="menu_logo_box" @click="changePage('/')">
        <img class="menu_logo_img" src="/src/assets/logo.png" />
        <a-typography-paragraph>{{store.state.login_state.username || "未登录"}}</a-typography-paragraph>
      </div>
      <a-menu mode="inline">
        <a-menu-item key="profile" @click="changePage('/')">
          <user-outlined />
          <span>个人信息</span>
        </a-menu-item>
        <a-sub-menu key="function">
          <template #title>
            <span>
              <bars-outlined />
              <span>功能</span>
            </span>
          </template>
          <a-menu-item key="f1" @click="changePage('/scheduleSystem')">排课系统(X)</a-menu-item>
          <a-menu-item key="f2" @click="changePage('/fantasyGPA')">幻想GPA</a-menu-item>
          <a-menu-item key="f3" @click="changePage('/fastSelection')">特殊脚本</a-menu-item>
        </a-sub-menu>
        <a-menu-item key="about"  @click="to_github_page">
          <question-outlined />
          <span>关于软件</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout-content>
      <router-view></router-view>
    </a-layout-content>
  </a-layout>

</template>

<script>
import {UserOutlined, BarsOutlined, QuestionOutlined } from '@ant-design/icons-vue';
import {defineComponent, ref} from 'vue';
import store from "/src/config/store"

export default defineComponent({
  name: "SUSTechDropTis",
  data() {
    return {
      collapsed: ref(false),
      store,
    }
  },
  components: {
    UserOutlined,
    BarsOutlined,
    QuestionOutlined
  },
  methods:{
    changePage(e){
      this.$router.push(e)
    },
    to_github_page(){
      window.open('https://github.com/Zoom1111/SUSTechDropTis')
    }
  }
})
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
}

.menu_layout .menu_logo_box {
  height: 32px;
  margin-top: 16px;
  margin-bottom: 16px;
}

.menu_logo_img{
  height: 32px;
  cursor: pointer;
}

</style>

