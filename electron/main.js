// 控制应用生命周期和创建原生浏览器窗口的模组
const {app, BrowserWindow, net, session, ipcMain, shell, dialog, Menu} = require('electron')
const path = require('path')
const {setElectron, addListen} = require('./script/request');
const NODE_ENV = process.env.NODE_ENV

// 添加request脚本所需要的模块
setElectron({net, session, ipcMain})
// 添加ipcMain监听
addListen()


// 当前应用的版本设置
let version = 220214
let win
function createWindow() {
    // 创建浏览器窗口
    win = new BrowserWindow({
        width: 1000, height: 800, webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false, // 关闭electron跨域请求安全检测
            nodeIntegration: true, // 集成nodejs开发环境
            contextIsolation: false, // 集成nodejs开发环境
        }
    })

    win.loadURL(
        NODE_ENV === 'development'
            ? 'http://localhost:3000'
            :`file://${path.join(__dirname, '../dist/index.html')}`
    );
    // 打开开发工具
    if (NODE_ENV === "development") {
        win.webContents.openDevTools()
    }

    // 把默认session设置为当前窗口的session
    session.defaultSession = win.webContents.session
    // 设置打开外链跳转到默认浏览器打开
    win.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

// 检测是否有最新版本
function checkUpdate(){
    const checkUpdate = net.request({
        method: "get",
        url: "https://github.com/Zoom1111/SUSTechDropTis/releases/latest",
        protocol: "https",
        useSessionCookies: true,
        session: session.defaultSession,
        credentials: "include", // 开启重定向时也自动设置cookie
        redirect:"manual"
    })

    checkUpdate.on("redirect", (statusCode , method, redirectURL, responseHeaders ) => {
        let newVersion = redirectURL.match(/\/releases\/tag\/(\S*)/)[1]
        if(version < parseInt(newVersion)){
           let idx = dialog.showMessageBoxSync(win, {
                message: "检测到有新版本，是否去下载？",
                type: "info",
                buttons: ["是", "否"],
                title: "版本检测"
            })
            // 选择了是，跳转到新版本下载地址
            if(idx === 0){
                shell.openExternal(redirectURL)
                app.quit()
            }
        }
        checkUpdate.followRedirect()
    })
    checkUpdate.end()
}

// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
    // 隐藏菜单栏
    Menu.setApplicationMenu(null)
    createWindow()
    checkUpdate()

    app.on('activate', function () {
        // 通常在 macOS 上，当点击 dock 中的应用程序图标时，如果没有其他
        // 打开的窗口，那么程序会重新创建一个窗口。
        if (BrowserWindow.getAllWindows().length === 0){
            createWindow()
            checkUpdate()
        }
    })
})

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此，通常对程序和它们在
// 任务栏上的图标来说，应当保持活跃状态，直到用户使用 Cmd + Q 退出。
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

// 渲染层跳转外链时，转到默认浏览器上
app.on('web-contents-created', (e, webContents) => {
    webContents.on('new-window', (event, url) => {
        event.preventDefault();
        shell.openExternal(url);
    });
});
