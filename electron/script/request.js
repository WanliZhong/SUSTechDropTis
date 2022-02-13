let electron

function setElectron(obj) {
    electron = obj
}

let login_data = {}
let xn, xq

function addListen() {
    // 添加登陆事件监听
    electron.ipcMain.on("login", (event, account_data) => {
        login(account_data, event)
    })

    // 添加获取全校课表信息事件监听
    electron.ipcMain.on("refreshCourseData", (event) => {
        refreshCourseData(event)
    })

    // 添加获取个人GPA信息事件监听
    electron.ipcMain.on("refreshGPAData", (event) => {
        refreshGPAData(event)
    })

    // 添加获取抢课信息事件监听
    electron.ipcMain.on("refreshSelectionCourseData", (event) => {
        refreshSelectionCourseData(event)
    })

    // 添加抢课事件监听
    electron.ipcMain.on("startSelection", (event, idList) => {
        startSelection(idList, event)
    })

}

// 将data对象转换成formdata格式
let getFormData = function (data) {
    let ret = ''
    for (let it in data) {
        ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&'
    }
    return ret
}

function login(account_data, event) {
    let request_obj = JSON.parse(account_data)
    // 发送请求获取cookie中的DISSESSION
    const request_DISSESSION = electron.net.request({
        method: "get",
        url: "https://cas.sustech.edu.cn/cas/clientredirect?client_name=Wework&service=https://tis.sustech.edu.cn/cas",
        protocol: "https",
        useSessionCookies: true,
        session: electron.session.defaultSession,
        credentials: "include", // 开启重定向时也自动设置cookie
    })
    request_DISSESSION.on('response', (response) => {
        // 发送请求获取登陆需要的execution参数
        const request_execution = electron.net.request({
            method: "get",
            url: "https://cas.sustech.edu.cn/cas/login?service=https://tis.sustech.edu.cn/cas",
            protocol: "https",
            useSessionCookies: true,
            session: electron.session.defaultSession,
        })

        request_execution.on("response", response => {
            response.on("data", (login_page) => {
                request_obj.execution = `${login_page}`.match(/name="execution" value="(\S*)"\/>/)[1]
                // 发送请求获取后续操作所需要的cookie，包括route和JSESSIONID
                const request_cookie = electron.net.request({
                    method: "post",
                    url: "https://cas.sustech.edu.cn/cas/login?service=https://tis.sustech.edu.cn/cas",
                    protocol: "https",
                    useSessionCookies: true,
                    session: electron.session.defaultSession,
                    credentials: "include", // 开启重定向时也自动设置cookie
                })
                // 准备好登陆的数据，开始登陆
                let body = getFormData({
                    username: request_obj.username,
                    password: request_obj.password,
                    execution: request_obj.execution,
                    _eventId: 'submit',
                    geolocation: ""
                })
                // 发送post数据
                request_cookie.setHeader("Content-Type", "application/x-www-form-urlencoded")
                request_cookie.write(body)

                // 接收到cookie后成功返回教务系统主页面
                request_cookie.on("response", response => {
                    // 状态码为200才是登陆成功
                    if (response.statusCode === 200) {
                        event.sender.send("login", JSON.stringify({
                            status: true
                        }))
                        login_data = request_obj // 说明登陆数据是正确的，保存起来
                    }
                    // 可能是登陆密码错误之类的
                    else {
                        event.sender.send("login", JSON.stringify({
                            status: false
                        }))
                    }
                    // 发送通知，告诉渲染层，成功登陆，可以执行后续的操作
                })

                request_cookie.on("error", error => {
                    event.sender.send("login", JSON.stringify({
                        status: false
                    }))
                })
                request_cookie.end()
            })
        })

        request_execution.on("error", error => {
            event.sender.send("login", JSON.stringify({
                status: false
            }))
        })
        request_execution.end()
    })

    request_DISSESSION.on("error", error => {
        event.sender.send("login", JSON.stringify({
            status: false
        }))
    })
    request_DISSESSION.end()
}

function refreshCourseData(event) {
    const request_latest = electron.net.request({
        method: "post",
        url: "https://tis.sustech.edu.cn/component/queryXnxq",
        protocol: "https",
        useSessionCookies: true,
        session: electron.session.defaultSession,
        credentials: "include", // 开启重定向时也自动设置cookie
    })
    request_latest.on("response", response => {
        response.on("data", (term_tpye) => {
            let lastest = JSON.parse(`${term_tpye}`).content[0]
            xn = lastest.xn
            xq = lastest.xq
            const request_course_data = electron.net.request({
                method: "post",
                url: "https://tis.sustech.edu.cn/Xsxktz/queryRwxxcxList",
                protocol: "https",
                useSessionCookies: true,
                session: electron.session.defaultSession,
                credentials: "include", // 开启重定向时也自动设置cookie
            })

            let body = getFormData({
                p_xn: xn,
                p_xq: xq,
                p_xnxq: `${xn}${xq}`,
                p_chaxunpylx: 3,
                mxpylx: 3,
                p_sfhltsxx: 0,
                pageNum: 1,
                pageSize: 2000
            })
            let courseRawData = ""
            let replace = /"(\S[^"]*)":null,/ig  //用于匹配所有"xx":null,的字符串
            request_course_data.setHeader("Content-Type", "application/x-www-form-urlencoded")
            request_course_data.write(body)
            request_course_data.on("response", response => {
                // 数据流拼接完成后，返回处理后的数据给渲染层
                response.on("end", () => {
                    // 因为这返回的数据实在太冗杂了, 手动处理 一下
                    courseRawData = courseRawData.replaceAll(replace, "")
                    courseRawData = courseRawData.replaceAll("\n", "")
                    event.sender.send("refreshCourseData", JSON.stringify({
                        status: true,
                        data: courseRawData
                    }))
                })
                // 把每段数据流拼接起来
                response.on("data", (data) => {
                    courseRawData += `${data}`
                })
            })
            request_course_data.end()
            request_course_data.on("error", error => {
                event.sender.send("refreshCourseData", JSON.stringify({
                    status: false
                }))
            })
        })
    })
    request_latest.end()
    request_latest.on("error", error => {
        event.sender.send("refreshCourseData", JSON.stringify({
            status: false
        }))
    })
}

function refreshGPAData(event) {
    const request_gpa_data = electron.net.request({
        method: "post",
        url: "https://tis.sustech.edu.cn/cjgl/grcjcx/grcjcx",
        protocol: "https",
        useSessionCookies: true,
        session: electron.session.defaultSession,
        credentials: "include", // 开启重定向时也自动设置cookie
    })

    let replace = /"(\S[^"]*)":null,/ig  //用于匹配所有"xx":null,的字符串
    request_gpa_data.setHeader("Content-Type", "application/json")
    request_gpa_data.write(JSON.stringify({
        cxbj: -1,
        pylx: 1,
        current: 1,
        pageSize: 100
    }))
    request_gpa_data.on("response", response => {
        // 把每段数据流拼接起来
        response.on("data", (data) => {
            let rawData = `${data}`.replaceAll(replace, "")
            event.sender.send("refreshGPAData", JSON.stringify({
                status: true,
                data: rawData
            }))
        })
    })
    request_gpa_data.end()
    request_gpa_data.on("error", error => {
        console.log(error)
        event.sender.send("refreshGPAData", JSON.stringify({
            status: false
        }))
    })
}


function refreshSelectionCourseData(event) {
    const request_latest = electron.net.request({
        method: "post",
        url: "https://tis.sustech.edu.cn/component/queryXnxq",
        protocol: "https",
        useSessionCookies: true,
        session: electron.session.defaultSession,
        credentials: "include", // 开启重定向时也自动设置cookie
    })
    request_latest.on("response", response => {
        response.on("data", (term_tpye) => {
            let lastest = JSON.parse(`${term_tpye}`).content[0]
            xn = lastest.xn
            xq = lastest.xq
            let allSelectionCourse = []
            // 几种选课的模式，用于分别获取这些课程，然后合并
            let p_sfxsgwckb_list = ["bxxk", "xxxk", "kzyxk", "zynknjxk", "cxxk"]
            let cnt = 0
            p_sfxsgwckb_list.forEach((item) => {
                const request_course_data = electron.net.request({
                    method: "post",
                    url: "https://tis.sustech.edu.cn/Xsxk/queryKxrw",
                    protocol: "https",
                    useSessionCookies: true,
                    session: electron.session.defaultSession,
                    credentials: "include", // 开启重定向时也自动设置cookie
                })

                let body = getFormData({
                    p_pylx: 1,
                    mxpylx: 3,
                    p_xn: xn,
                    p_xq: xq,
                    p_xnxq: `${xn}${xq}`,
                    p_dqxn: xn,
                    p_dqxq: xq,
                    p_dqxnxq: `${xn}${xq}`,
                    p_xkfsdm: item,
                    p_sfxsgwckb: 1,
                    pageNum: 1,
                    pageSize: 2000
                })

                let courseRawData = ""
                let replace = /"(\S[^"]*)":null,/ig  //用于匹配所有"xx":null,的字符串
                request_course_data.setHeader("Content-Type", "application/x-www-form-urlencoded")
                request_course_data.write(body)
                request_course_data.on("response", response => {
                    // 数据流拼接完成后，返回处理后的数据给渲染层
                    response.on("end", () => {
                        // 因为这返回的数据实在太冗杂了, 手动处理 一下
                        courseRawData = courseRawData.replaceAll(replace, "")
                        courseRawData = courseRawData.replaceAll("\n", "")
                        let courseData = JSON.parse(courseRawData).kxrwList.list
                        courseData.forEach((item) => {
                            allSelectionCourse.push(item);
                        })
                        cnt += 1
                        if (cnt === p_sfxsgwckb_list.length) {
                            event.sender.send("refreshSelectionCourseData", JSON.stringify({
                                status: true,
                                data: allSelectionCourse
                            }))
                        }
                    })
                    // 把每段数据流拼接起来
                    response.on("data", (data) => {
                        courseRawData += `${data}`
                    })
                })
                request_course_data.end()
                request_course_data.on("error", error => {
                    event.sender.send("refreshSelectionCourseData", JSON.stringify({
                        status: false
                    }))
                })
            })

        })
    })
    request_latest.end()
    request_latest.on("error", error => {
        event.sender.send("refreshCourseData", JSON.stringify({
            status: false
        }))
    })
}

function startSelection(idListString, event) {
    let idList = JSON.parse(idListString)
    setInterval(() => {
        idList.forEach((item) => {
            const course_selection = electron.net.request({
                method: "post",
                url: "https://tis.sustech.edu.cn/Xsxk/addGouwuche",
                protocol: "https",
                useSessionCookies: true,
                session: electron.session.defaultSession,
                credentials: "include", // 开启重定向时也自动设置cookie
            })

            let body = getFormData({
                p_pylx: 1,
                p_xktjz: "rwtjzyx",
                p_xn: xn,
                p_xq: xq,
                p_xnxq: `${xn}${xq}`,
                p_xkfsdm: "bxxk",
                p_id: item,
                p_sfxsgwckb: 1,
            })

            course_selection.setHeader("Content-Type", "application/x-www-form-urlencoded")
            course_selection.write(body)
            course_selection.on("response", response => {
                // 把每段数据流拼接起来
                response.on("data", (data) => {
                    let message = `${data}`
                    //选课方式不可选
                    if (message.indexOf("SUCCESS") !== -1) {
                        event.sender.send("selected", JSON.stringify({
                            status: true,
                            data: message
                        }))
                    }
                })
            })
            course_selection.end()
            course_selection.on("error", error => {
                event.sender.send("startSelection", JSON.stringify({
                    status: false
                }))
            })
        })
    }, 100)

}


module.exports = {
    setElectron,
    addListen,
}
