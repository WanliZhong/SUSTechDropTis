<template>
  <a-col style="margin-bottom: 100px">
    <a-row align="bottom" class="header" justify="space-between">
      <a-typography-title style="margin: 0">抢课脚本</a-typography-title>
      <a-space direction="horizontal" size="middle">
        <a-button shape="round" type="primary">说明</a-button>
      </a-space>
    </a-row>


    <a-col style="background: white; padding: 15px;">
      <a-row>
        <a-button shape="round" style="margin-right:30px;" type="primary" @click="refreshSelectionCourseData">
          <template #icon>
            <reload-outlined/>
          </template>
          刷新数据
        </a-button>
      </a-row>

      <a-row>
        <a-typography-paragraph style="margin: 0;">
          <text style="color: red">提示</text>
          >>>先刷新数据，然后在左侧框中，选择需要抢课的课程，并添加到右侧框中。
        </a-typography-paragraph>
      </a-row>

      <a-transfer
          v-model:targetKeys="targetKeys"
          :dataSource="courseData"
          :filterOption="(inputValue, item) => item.fullName.indexOf(inputValue.toLowerCase()) !== -1"
          :locale="{ itemUnit: '请添加课程', itemsUnit: '选择课程', notFoundContent: '列表为空', searchPlaceholder: '可按 全称 搜索' }"
          :showSearch="true"
          :showSelectAll="true"
          style="background: white"
      >
        <template
            #children="{
          direction,
          filteredItems,
          selectedKeys,
          disabled,
          onItemSelectAll,
          onItemSelect,
        }"
        >
          <a-table
              :columns="direction === 'left' ? courseFilterLeftColumns : courseFilterRightColumns"
              :customRow="
            (record) => ({
              onClick: () => {
                  onItemSelect(record.key, !selectedKeys.includes(record.key));
              },
            })
          "
              :dataSource="filteredItems"
              :rowSelection="
            getRowSelection({
              selectedKeys,
              onItemSelectAll,
              onItemSelect,
            })
          "
              style="white-space: pre-line;"
          >
          </a-table>
        </template>
      </a-transfer>

    </a-col>
    <a-row justify="center" style="margin-top: 30px; margin-bottom: 30px;">
      <a-button shape="round" type="primary" @click="prepareSelection">准备抢课</a-button>
    </a-row>
  </a-col>

</template>

<script>
import {ReloadOutlined} from '@ant-design/icons-vue'
import {defineComponent} from 'vue'
import store from "../config/store";
import {message} from "ant-design-vue";

const {ipcRenderer} = require("electron");

export default defineComponent({
  name: "fastSelection",
  components: {
    ReloadOutlined
  },

  data() {
    return {
      targetKeys: [],
      courseData: [],
      courseFilterLeftColumns: [
        {
          dataIndex: 'fullName',
          title: "课程全称",
        }, {
          dataIndex: "code",
          title: "课程代码"
        }, {
          dataIndex: 'status',
          title: '已选 / 容量',
        }
      ],
      // 右框的列设置
      courseFilterRightColumns: [{
        dataIndex: 'fullName',
        title: "课程全称",
      }, {
        dataIndex: "code",
        title: "课程代码"
      }, {
        dataIndex: 'status',
        title: '已选 / 容量',
      }],
    };
  },
  computed: {},
  methods: {
    log(e) {
      console.log(e)
    },
    refreshSelectionCourseData() {
      // 向主进程发送, 让主进程帮忙发包
      ipcRenderer.send("refreshSelectionCourseData", "");
      ipcRenderer.on("refreshSelectionCourseData", (event, data) => {
        let re = JSON.parse(data)
        if (re.status) {
          // 收到数据就格式化一下，然后存到store里去
          store.state.rawSelectionCourseData = re.data
          let data = store.state.rawSelectionCourseData
          this.courseData = []
          data.forEach((item) => {
            let obj = {
              key: item.id,
              fullName: item.rwmc,
              code: item.kcdm,
              status: `${item.yxzrs} / ${item.zrl}`,
            }
            this.courseData.push(obj)
          })
        }
      })
    },

    prepareSelection(){
      console.log(this.targetKeys)
      let date = new Date()
      let minHours = 12, maxHours = 13
      let minMinutes = 50, maxMinutes = 10
      // let minHours = 0, maxHours = 24
      // let minMinutes = 0, maxMinutes = 60
      let hours = date.getHours(), minutes = date.getMinutes()
      console.log(hours, minutes)
      ipcRenderer.on("selected", (event, data) => {
        let d = JSON.parse(data)
        if(d.status){
          // 提示选课成功
          message.success({
            content: d.data,
            key: d.data,
            duration: 1,
          })
        }
      })
      if(minHours <= hours && hours <= maxHours && (minMinutes <= minutes || minutes <= maxMinutes)){
        ipcRenderer.send("startSelection", JSON.stringify(this.targetKeys));
      }else{
        // 请在12:50-13:10启用，否则不予启动
        message.error({
          content: "请在12:50-13:10启用，否则不予启动",
          key: "date",
          duration: 3,
        })
        console.log("请在12:50-13:10启用，否则不予启动")
      }
    },

    getRowSelection({
                      selectedKeys,
                      onItemSelectAll,
                      onItemSelect,
                    }) {
      return {
        onSelectAll(selected, selectedRows) {
          const treeSelectedKeys = selectedRows.filter(item => !item.disabled).map(({key,}) => key);
          onItemSelectAll(treeSelectedKeys, selected);
        },
        onSelect({key}, selected) {
          onItemSelect(key, selected);
        },

        selectedRowKeys: selectedKeys,
      };
    },

  }

});
</script>

<style scoped>
.header {
  background: #ffffff;
  padding: 10px 18px;
}
</style>
