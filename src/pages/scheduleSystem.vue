<template>
  <a-col style="margin-bottom: 100px">
    <a-row align="bottom" class="header" justify="space-between">
      <a-typography-title style="margin: 0">排课系统</a-typography-title>
      <a-space direction="horizontal" size="middle">
        <a-button shape="round" type="primary">说明</a-button>
      </a-space>
    </a-row>

    <a-collapse v-model:activeKey="courseFilterActiveKey" :bordered="false">
      <a-collapse-panel key="1" class="filter_panel" header="课程筛选">
        <div>
          <a-col>
            <a-row align="middle">
                <a-button shape="round" type="primary" style="margin-right:30px;" @click="refreshCourseData">
                  <template #icon>
                    <reload-outlined/>
                  </template>
                  刷新数据
                </a-button>

              <a-typography-paragraph :span="6" style="margin: 0">培养类型：</a-typography-paragraph>
              <a-select
                  ref="select"
                  v-model:value="degree"
                  @change="changeCourseData"
              >
                <a-select-option :value="0">不限</a-select-option>
                <a-select-option :value="1">本科生</a-select-option>
                <a-select-option :value="2">研究生</a-select-option>
              </a-select>
            </a-row>

            <a-typography-paragraph style="margin: 0">
              <text style="color: red">提示</text>
              >>>请在左侧框中，选择排课表的课程范围，并添加到右侧框中，
              <text style="color: red">同时请在右框中双击或者右键课程，设置排课必选状态</text>
              。注：课程越多，生成课表的速度可能会越慢。
            </a-typography-paragraph>
          </a-col>
          <a-transfer
              v-model:targetKeys="targetKeys"
              :dataSource="courseData"
              :filterOption="(inputValue, item) => item.fullSearchInfo.indexOf(inputValue.toLowerCase()) !== -1"
              :locale="{ itemUnit: '请添加课程', itemsUnit: '选择课程', notFoundContent: '列表为空', searchPlaceholder: '可按 全称/代码/信息 搜索' }"
              :showSearch="true"
              :showSelectAll="true"
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
              onDblclick:()=>{
                record.must = !record.must
              },
               onContextmenu: () => {
                record.must = !record.must
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
                  <div v-if="column.dataIndex === 'must'">
                    <a-tag v-if="record.must" color="green">是</a-tag>
                    <a-tag v-if="!record.must" color="red">否</a-tag>
                  </div>
                </template>

              </a-table>
            </template>
          </a-transfer>
        </div>
      </a-collapse-panel>

      <a-collapse-panel key="2" class="filter_panel" header="时间筛选">
        <div>
          <a-table
              :columns="timeFilterColumns"
              :dataSource="timeFilterData"
              :pagination="false"
              bordered
          >
            <template #bodyCell="{text, record, index, column}">
              <div v-if="record[column.dataIndex] && column.dataIndex !== 'time'">
                <a-tag color="green" style="cursor: pointer" @click="record[column.dataIndex] = false">可排课</a-tag>
              </div>
              <div v-if="!record[column.dataIndex] && column.dataIndex !== 'time'">
                <a-tag color="red" style="cursor: pointer" @click="record[column.dataIndex] = true">不排课</a-tag>
              </div>
            </template>
            <template #title>
              <a-row>
                <text>设置无课日：</text>
                <a-checkbox v-model:checked="checkBoxData.noMon" @change="setNoDay('mon' ,checkBoxData.noMon)">周一
                </a-checkbox>
                <a-checkbox v-model:checked="checkBoxData.noTue" @change="setNoDay('tue' ,checkBoxData.noTue)">周二
                </a-checkbox>
                <a-checkbox v-model:checked="checkBoxData.noWed" @change="setNoDay('wed' ,checkBoxData.noWed)">周三
                </a-checkbox>
                <a-checkbox v-model:checked="checkBoxData.noThu" @change="setNoDay('thu' ,checkBoxData.noThu)">周四
                </a-checkbox>
                <a-checkbox v-model:checked="checkBoxData.noFri" @change="setNoDay('fri' ,checkBoxData.noFri)">周五
                </a-checkbox>
                <a-checkbox v-model:checked="checkBoxData.noSat" @change="setNoDay('sat' ,checkBoxData.noSat)">周六
                </a-checkbox>
                <a-checkbox v-model:checked="checkBoxData.noSun" @change="setNoDay('sun' ,checkBoxData.noSun)">周日
                </a-checkbox>
              </a-row>
              <a-row>
                <text>设置其他项：</text>
                <a-checkbox v-model:checked="checkBoxData.noMorning" @change="setNoRow([1, 2], checkBoxData.noMorning)">
                  无早八
                </a-checkbox>
                <a-checkbox v-model:checked="checkBoxData.noEvening"
                            @change="setNoRow([9, 10, 11], checkBoxData.noEvening)">无晚课
                </a-checkbox>
              </a-row>
            </template>
          </a-table>
        </div>
      </a-collapse-panel>

      <a-collapse-panel key="3" class="filter_panel" header="其他设置">
        <div>
          学分范围：
          <a-input-number id="inputNumber" v-model:value="minCredit" :max="25" :min="0"/>
          ——
          <a-input-number id="inputNumber" v-model:value="maxCredit" :max="25" :min="minCredit"/>
        </div>
      </a-collapse-panel>

    </a-collapse>

    <a-row justify="center" style="margin-top: 30px; margin-bottom: 30px;">
      <a-button shape="round" type="primary" @click="generateSchedule">生成课表</a-button>
    </a-row>


  </a-col>
</template>

<script>
import {ReloadOutlined} from '@ant-design/icons-vue'
import {defineComponent} from 'vue'
import store from "../config/store";

const {ipcRenderer} = require("electron");

export default defineComponent({
  name: "scheduleSystem",
  components: {
    ReloadOutlined
  },

  data() {
    return {
      store,
      // 选择框设置
      degree: 0,
      // 穿梭框的设置
      courseData: [],
      courseData_0: [],
      courseData_1: [],
      courseData_2: [],
      courseFilterActiveKey: "",
      targetKeys: [],
      // 左框的列设置
      courseFilterLeftColumns: [
        {
          dataIndex: 'fullName',
          title: "课程全称",
        }, {
          dataIndex: 'code',
          title: '课程代码',
        },
        {
          dataIndex: "info",
          title: "上课信息",
        }
      ],
      // 右框的列设置
      courseFilterRightColumns: [{
        dataIndex: 'fullName',
        title: '课程全称',
      }, {
        dataIndex: "must",
        title: "排课必须有",
      }],
      // 时间筛选框表头设置
      timeFilterColumns: [{
        dataIndex: 'time',
        title: "课程小节",
      }, {
        dataIndex: 'mon',
        title: '星期一',
      }, {
        dataIndex: "tue",
        title: "星期二",
      }, {
        dataIndex: 'wed',
        title: '星期三',
      }, {
        dataIndex: "thu",
        title: "星期四",
      }, {
        dataIndex: 'fri',
        title: '星期五',
      }, {
        dataIndex: "sat",
        title: "星期六",
      }, {
        dataIndex: "sun",
        title: "星期日",
      }],
      // 时间筛选数据
      timeFilterData: [],
      // 存放勾选框的true和false值
      checkBoxData: {
        noMon: false,
        noTue: false,
        noWed: false,
        noThu: false,
        noFri: false,
        noSat: false,
        noSun: false,
        noMorning: false,
        noEvening: false,
      },
      // 学分范围
      minCredit: 10,
      maxCredit: 25,
    };
  },
  computed: {},
  created() {
    // 初始化时间筛选功能
    let obj = []
    for (let i = 1; i <= 11; i++) {
      obj.push({
        key: i,
        time: `第${i}节`,
        mon: true,
        tue: true,
        wed: true,
        thu: true,
        fri: true,
        sat: true,
        sun: true,
      })
    }
    this.timeFilterData = obj
  },
  methods: {
    refreshCourseData() {
      // 向主进程发送, 让主进程帮忙发包
      // 重新去教务系统拉取所有课程信息
      ipcRenderer.send("refreshCourseData", "");
      ipcRenderer.on("refreshCourseData", (event, data) => {
        let re = JSON.parse(data)
        if (re.status) {
          // 收到数据就格式化一下，然后存到store里去
          store.state.rawCourseData = JSON.parse(re.data)
          this.registerCourseData()
        } else {
          console.log("fail")
        }
      })
    },
    log(e) {
      console.log(e)
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
    changeCourseData(value) {
      if (value === 0) {
        this.courseData = this.courseData_0
      } else if (value === 1) {
        this.courseData = this.courseData_1
      } else if (value === 2) {
        this.courseData = this.courseData_2
      }
    },
    // 将拉取的课程信息转换为我们想要的格式
    registerCourseData() {
      this.courseData.length = 0
      let courseAll = store.state.rawCourseData.rwList.list
      courseAll.forEach((item) => {
        let info = this.parseInfo(item.kcxx)
        let obj = {
          // key: item.id,
          key: item.id,
          fullName: item.rwmc,
          code: item.kcdm,
          info: info,
          must: false,
          credit: item.xf,
          degreeType: item.pylx,
          fullSearchInfo: (item.rwmc + item.kcdm + info).toLowerCase(),
        }
        if (item.pylx === "1") {
          this.courseData_1.push(obj)
        } else if (item.pylx === "2") {
          this.courseData_2.push(obj)
        }
        this.courseData_0.push(obj)
      })
      this.changeCourseData(this.degree)
    },


    parseInfo(s) {
      let searchAllSubstring = function (str, subStr) {
        let positions = []
        let pos = str.indexOf(subStr);
        while (pos > -1) {
          positions.push(pos);
          pos = str.indexOf(subStr, pos + 1);
        }
        return positions
      }

      let getTeacher = function (str) {
        if (str.length === 0) return
        let re = "\n"
        let regTeacher = />(\S[^<]*)<\/a>/ig  //用于匹配所有";'>*</a>"的字符串
        let teachers = str.match(regTeacher)
        if (teachers === null) return
        teachers.forEach((item, index) => {
          re += item.slice(1, -4)
          re += index === teachers.length - 1 ? ": " : ", "
        })
        return re
      }

      let getInfo = function (str) {
        if (str.length === 0) return
        let re = ""
        let regInfo = /<p>(\S[^<]*)<\/p>/ig  //用于匹配所有<p>*</p>的字符串
        let info = str.match(regInfo)
        if (info === null) return
        info.forEach((item) => {
          re += "\n"
          re += item.slice(3, -4)
        })
        return re
      }

      let allParts = searchAllSubstring(s, "上课信息")
      allParts.push(s.length - 1)
      let parseResult = ""
      let r = 0
      allParts.forEach((item) => {
        let info = getInfo(s.slice(r, item + 1))
        let teacher = getTeacher(s.slice(r, item + 1))
        if (info) parseResult += info
        if (teacher) parseResult += teacher
        r = item
      })

      return parseResult.trim()
    },
    parseTimeSchedule(str) {
      let timeSchedule = Array.from({length: 17}, () => {
        return {
          mon: Array(12).fill(""),
          tue: Array(12).fill(""),
          wed: Array(12).fill(""),
          thu: Array(12).fill(""),
          fri: Array(12).fill(""),
          sat: Array(12).fill(""),
          sun: Array(12).fill(""),
        }
      })

      // 用来填充一个周的一个课程信息
      let fillAWeek = function (week, dayTime, location) {
        dayTime.list.forEach((item) => {
          timeSchedule[week][dayTime.day][item] = location
        })
      }

      let parseAInfo = function (s) {
        let sList = s.split(" ")
        let timeInfo = sList[0]
        let locationInfo = sList[1] // 课程所占用的地点

        let weekIndex = timeInfo.indexOf(",星期")

        // 周的信息
        let weekInfo = timeInfo.slice(0, weekIndex)
        // 周几的信息
        let dayInfo = timeInfo.slice(weekIndex)
        let dayTime = {day: "", list: []}
        // 处理周几第几节课的信息
        if (dayInfo.includes("一")) dayTime.day = "mon"
        else if (dayInfo.includes("二")) dayTime.day = "tue"
        else if (dayInfo.includes("三")) dayTime.day = "wed"
        else if (dayInfo.includes("四")) dayTime.day = "thu"
        else if (dayInfo.includes("五")) dayTime.day = "fri"
        else if (dayInfo.includes("六")) dayTime.day = "sat"
        else if (dayInfo.includes("日")) dayTime.day = "sun"

        let regInfo = /第(\S*)节/
        let timeString = dayInfo.match(regInfo)[1]

        let itemList = timeString.split("-")
        // 如果itemList中有2个值，那就是范围
        if (itemList.length === 2) {
          for (let i = parseInt(itemList[0]); i <= parseInt(itemList[1]); i += 1) {
            dayTime.list.push(i)
          }
        } else {
          dayTime.list.push(parseInt(itemList[0]))
        }

        let type // 0是不分单双周，1是单周，2是双周
        let onlyWeekString
        if (weekInfo.indexOf("单周") !== -1) {
          type = 1
          onlyWeekString = weekInfo.slice(0, -2)
        } else if (weekInfo.indexOf("双周") !== -1) {
          type = 2
          onlyWeekString = weekInfo.slice(0, -2)
        } else {
          type = 0
          onlyWeekString = weekInfo.slice(0, -1)
        }

        // 如果是单双周就每次跳2步，否则只跳1步
        let step = type > 0 ? 2 : 1

        onlyWeekString.split(",").forEach((item) => {
          let itemList = item.split("-")
          // 如果itemList中有2个值，那就是范围
          if (itemList.length === 2) {
            // 循环处理一周的内容
            for (let i = parseInt(itemList[0]); i <= parseInt(itemList[1]); i += step) {
              fillAWeek(i, dayTime, locationInfo)
            }
          }
          // 否则这个就是单独的一周
          else {
            let i = parseInt(itemList[0])
            fillAWeek(i, dayTime, locationInfo)
          }
        })
      }

      let strList = str.split("\n")
      strList.forEach((item) => {
        // 说明这个信息是有用的
        if (item.includes("周,星期")) {
          parseAInfo(item)
        }
      })
      // console.log(timeSchedule)
      return timeSchedule
    },

    setNoDay(day, state) {
      this.timeFilterData.forEach((item) => {
        item[day] = !state
      })
    },

    setNoRow(numberList, state) {
      this.timeFilterData.forEach((item) => {
        if (numberList.includes(item.key)) {
          item.mon = !state
          item.tue = !state
          item.wed = !state
          item.thu = !state
          item.fri = !state
          item.sat = !state
          item.sun = !state
        }
      })
    },

    // 生成课表的按钮触发
    generateSchedule() {
      // 如果不冲突，返回课表，如果冲突，返回
      let checkConflict = function(){

      }

      let selectedCourses = this.courseData.filter(item => this.targetKeys.includes(item.key))
      selectedCourses.forEach((item) =>{
        item.schedule = this.parseTimeSchedule(item.info)
      })
      let mustCourses = selectedCourses.filter(item => item.must)
      // 检测一下，必选的课是否冲突 或者 超过设定的学分了
      checkConlict(mustList, freeList)

    }

  }
})
</script>

<style scoped>
.header {
  background: #ffffff;
  padding: 10px 18px;
}

.filter_panel {
  background: #ffffff;
  text-align: left;
}
</style>
