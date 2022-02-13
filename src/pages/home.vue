<template>
  <a-row align="middle" justify="center" style="min-height:100vh" type="flex">
    <a-col :span="12" align="center">
      <a-space direction="vertical" size="middle">
        <img alt="SUSTechDropTis LOGO" src="/src/assets/logo.png"/>
        <a-typography-title style="margin: 0">SUSTechDropTis</a-typography-title>
        <a-typography-paragraph style="margin: 0">这是一个为南科大教务系统 <a target="_blank" href="https://tis.sustech.edu.cn">https://tis.sustech.edu.cn</a> 而开发的拓展工具。
        </a-typography-paragraph>
        <a-divider style="margin: 0">CAS 账号登陆</a-divider>

        <a-input v-model:value="login_data.username" :maxlength="8" class="input"
                 placeholder="学号">
          <template #prefix>
            <user-outlined type="user"/>
          </template>
          <template #suffix>
            <a-tooltip title="本工具完全开源，将不会记录您的任何信息，请放心使用">
              <info-circle-outlined style="color: rgba(0, 0, 0, 0.45)"/>
            </a-tooltip>
          </template>
        </a-input>

        <a-input-password v-model:value="login_data.password" class="input" placeholder="密码">
          <template #prefix>
            <lock-outlined/>
          </template>
        </a-input-password>

        <a-button class="button_login" shape="round" type="primary" @click="cas_login">登陆
        </a-button>
      </a-space>
    </a-col>
  </a-row>
</template>

<script>
import {InfoCircleOutlined, LockOutlined, UserOutlined} from '@ant-design/icons-vue'
import {defineComponent} from 'vue'
import {message} from "ant-design-vue"
import store from "/src/config/store"

const {ipcRenderer} = require("electron");

export default defineComponent({
  name: "home",
  components: {
    UserOutlined,
    InfoCircleOutlined,
    LockOutlined
  },

  data() {
    return {
      login_now: false,
      login_data: {
        username: "",
        password: "",
      }
    };
  },
  methods: {
    cas_login() {
      // 提示正在处理
      message.loading({
        content: '获取CAS登陆...',
        key: "login",
        duration: 0,
      })
      // 向主进程发送, 让主进程帮忙发包
      ipcRenderer.send("login", JSON.stringify(this.login_data));
      ipcRenderer.on("login", (event, data) => {
        this.login_now = JSON.parse(data).status
        if (this.login_now) {
          // 设置全局登陆信息
          store.state.login_state.username = this.login_data.username
          store.state.login_state.password = this.login_data.password
          // 提示用户登陆成功
          message.success({
            content: '成功登陆',
            key: "login",
            duration: 2,
          })
        } else {
          message.error({
            content: '登陆失败，请检查账户密码或网络状况',
            key: "login",
            duration: 3,
          })
        }
      })
    },
  }

});
</script>

<style scoped>
.input {
  width: 60%;
  border-radius: 50px;
}

.button_login {
  width: 60%;
}
</style>
