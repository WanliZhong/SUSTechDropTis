<template>
  <a-col style="margin-bottom: 100px">
    <a-row align="bottom" class="header" justify="space-between">
      <a-typography-title style="margin: 0">幻想GPA</a-typography-title>
      <a-space direction="horizontal" size="middle">
        <a-button shape="round" type="primary">说明</a-button>
      </a-space>
    </a-row>


    <a-col style="background: white; padding: 15px;">
      <a-typography-title :level="2" style="margin: 0">GPA：<span style="color: #1890ff">{{ avgGPA }}</span></a-typography-title>
      <a-typography-title :level="2" style="margin: 0">学分：<span style="color: #1890ff">{{ totalCredit }}</span></a-typography-title>
      <a-row>
        <a-button shape="round" style="margin-right:30px;" type="primary" @click="refreshGPAData">
          <template #icon>
            <reload-outlined/>
          </template>
          刷新数据
        </a-button>

        <a-button shape="round" type="primary" @click="addData">
          <template #icon>
            <plus-outlined/>
          </template>
          增加数据
        </a-button>
      </a-row>

      <a-row>
        <a-typography-paragraph style="margin: 0;">
          <text style="color: red">提示</text>
          >>>先刷新数据，然后在左侧框中，选择需要计算的GPA课程，并添加到右侧框中。
        </a-typography-paragraph>
      </a-row>


      <a-transfer
          v-model:targetKeys="targetKeys"
          :dataSource="gpaData"
          :filterOption="(inputValue, item) => item.fullName.indexOf(inputValue.toLowerCase()) !== -1"
          :locale="{ itemUnit: '请添加课程', itemsUnit: '选择课程', notFoundContent: '列表为空', searchPlaceholder: '可按 全称 搜索' }"
          :showSearch="true"
          :showSelectAll="true"
          style="background: white"
          @change="transfer_change"
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
                if(!this.editableData[record.key]){
                  onItemSelect(record.key, !selectedKeys.includes(record.key));
                }
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

            <template #bodyCell="{text, record, index, column}">

              <template v-if="direction === 'right' && column.dataIndex === 'fullName'">
                <a-input
                    v-if="editableData[record.key]"
                    v-model:value="editableData[record.key][column.dataIndex]"
                    style="margin: -5px 0"
                />
              </template>
              <template v-else-if="direction === 'right' && column.dataIndex === 'credit'">
                <a-input-number
                    v-if="editableData[record.key]"
                    v-model:value="editableData[record.key][column.dataIndex]"
                    :max="10"
                    :min="0"
                    :step="0.5"
                    string-mode
                    style="margin: -5px 0"
                />
              </template>
              <template v-else-if="direction === 'right' && column.dataIndex === 'grade'">
                <a-input-number
                    v-if="editableData[record.key]"
                    v-model:value="editableData[record.key][column.dataIndex]"
                    :max="100"
                    :min="0"
                    :step="0.5"
                    string-mode
                    style="margin: -5px 0"
                    @change="formatLevelAndGPA(this.editableData[record.key])"
                />
              </template>
              <template v-else-if="direction === 'right' && column.dataIndex === 'level' && editableData[record.key]">
                {{ editableData[record.key][column.dataIndex] }}
              </template>
              <template v-else-if="direction === 'right' && column.dataIndex === 'operation'">
                <div class="editable-row-operations">
          <span v-if="editableData[record.key]">
            <a @click="save(record.key)">保存</a>
                   <a-divider type="vertical"/>
            <a-popconfirm title="Sure to cancel?" @confirm="cancel(record.key)">
              <a>取消</a>
            </a-popconfirm>
          </span>
                  <span v-else>
            <a @click="edit(record.key)">编辑</a>
                    <a-divider type="vertical"/>
                    <a @click="deleteData(record.key)">删除</a>
          </span>
                </div>
              </template>
              <template v-else>{{ text }}</template>

            </template>

          </a-table>
        </template>
      </a-transfer>
    </a-col>
  </a-col>

</template>

<script>
import {PlusOutlined, ReloadOutlined} from '@ant-design/icons-vue'
import {defineComponent} from 'vue'
import store from "../config/store";

const {ipcRenderer} = require("electron");

export default defineComponent({
  name: "fantasyGPA",
  components: {
    ReloadOutlined,
    PlusOutlined
  },

  data() {
    return {
      targetKeys: [],
      avgGPA: 0,
      totalCredit: 0,
      gpaData: [],
      editableData: {},
      courseFilterLeftColumns: [
        {
          dataIndex: 'fullName',
          title: "课程全称",
        }, {
          dataIndex: "credit",
          title: "学分"
        }, {
          dataIndex: 'grade',
          title: '总评成绩',
        },
        {
          dataIndex: "level",
          title: "等级成绩",
        }
      ],
      // 右框的列设置
      courseFilterRightColumns: [{
        dataIndex: 'fullName',
        title: "课程全称",
      }, {
        dataIndex: "credit",
        title: "学分"
      }, {
        dataIndex: 'grade',
        title: '总评成绩',
      },
        {
          dataIndex: "level",
          title: "等级成绩",
        }, {
          dataIndex: "operation",
          title: "操作"
        }],


    };
  },
  computed: {},
  methods: {
    log(e) {
      console.log(e)
    },
    refreshGPAData() {
      // 向主进程发送, 让主进程帮忙发包
      // 重新去教务系统拉取GPA课程的信息
      ipcRenderer.send("refreshGPAData", "");
      ipcRenderer.on("refreshGPAData", (event, data) => {
        let re = JSON.parse(data)
        if (re.status) {
          this.gpaData = []
          // 收到数据就格式化一下，然后存到store里去
          store.state.rawGPAData = JSON.parse(re.data)
          let gpaData = store.state.rawGPAData.content.list

          gpaData.forEach((item) => {
            let fullName = `${item.xnxqmc}-${item.kcmc}-${item.kcdm}`
            let obj = {
              key: item.rwid,
              fullName: fullName,
              credit: item.xf,
              grade: item.zpcj,
              level: item.xscj,
            }
            this.formatLevelAndGPA(obj)
            this.gpaData.push(obj)
          })
        }
      })
    },
    transfer_change(nextTargetKeys, direction, moveKeys) {
      // 检查右边的项目，如果要左移，那就给他取消编辑模式
      if (direction === "left") {
        moveKeys.forEach((item) => {
          if (this.editableData[item]) {
            this.cancel(item)
          }
        })
      }

      this.refreshTotal()

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
    formatLevelAndGPA(obj) {
      let grade = obj.grade
      if (typeof (grade) == 'string' && grade.includes("通过")) {
        obj.level = "P"
        obj.gpa = -1
      } else if (96.5 <= grade) {
        obj.level = "A+"
        obj.gpa = 4.00
      } else if (92.5 <= grade && grade < 96.5) {
        obj.level = "A"
        obj.gpa = 3.94
      } else if (89.5 <= grade && grade < 92.5) {
        obj.level = "A-"
        obj.gpa = 3.85
      } else if (86.5 <= grade && grade < 89.5) {
        obj.level = "B+"
        obj.gpa = 3.73
      } else if (82.5 <= grade && grade < 86.5) {
        obj.level = "B"
        obj.gpa = 3.55
      } else if (79.5 <= grade && grade < 82.5) {
        obj.level = "B-"
        obj.gpa = 3.32
      } else if (76.5 <= grade && grade < 79.5) {
        obj.level = "C+"
        obj.gpa = 3.09
      } else if (72.5 <= grade && grade < 76.5) {
        obj.level = "C"
        obj.gpa = 2.78
      } else if (69.5 <= grade && grade < 72.5) {
        obj.level = "C-"
        obj.gpa = 2.42
      } else if (66.5 <= grade && grade < 69.5) {
        obj.level = "D+"
        obj.gpa = 2.08
      } else if (62.5 <= grade && grade < 66.5) {
        obj.level = "D"
        obj.gpa = 1.63
      } else if (59.5 <= grade && grade < 62.5) {
        obj.level = "D-"
        obj.gpa = 1.15
      } else {
        obj.level = "F"
        obj.gpa = 0.00
      }
    },
    edit(key) {
      this.editableData[key] = JSON.parse(JSON.stringify(this.gpaData.filter(item => key === item.key)[0]))
    },
    save(key) {
      Object.assign(this.gpaData.filter(item => key === item.key)[0], this.editableData[key])
      delete this.editableData[key];
      this.refreshTotal()
    },
    cancel(key) {
      delete this.editableData[key];
    },
    deleteData(key){
      this.gpaData = this.gpaData.filter(item => item.key !== key);
      this.refreshTotal()
    },
    addData() {
      let newKey = Math.round(Math.random() * 999999999);
      let newKeyStr = `${newKey}`
      this.gpaData.push({
        key: newKeyStr,
        fullName: newKeyStr,
        credit: 0,
        grade: "通过",
        level: "P",
        gpa: -1,
      })
      this.targetKeys.push(newKeyStr)
      this.edit(newKeyStr)
    },
    refreshTotal() {
      let totalData = this.gpaData.filter(item => this.targetKeys.includes(item.key))
      let totalGPA = 0
      let totalCredit = 0
      let cnt = 0
      totalData.forEach((item) => {
        if (item.gpa !== -1) {
          cnt += 1
          totalGPA += item.gpa * item.credit
          totalCredit += item.credit
        }
      })
      this.avgGPA = (totalGPA / totalCredit).toFixed(2)
      if (cnt === 0) this.avgGPA = 0.00
      this.totalCredit = totalCredit
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
