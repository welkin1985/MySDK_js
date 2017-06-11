(function () {
    //配置文件
    var conf = {
        requestUrl      : "http://47.92.108.46:11111/log.gif?", //nginx的公网IP和nginx的监听端口
        cookiePath      : "/",
        cookieExpires   : 315360000000,
        sessionTimeOut  : 1800000,
        sepInData       : "&",
        version         : "1.0"
    };

    //cookie文件常量
    var cookieFields = {
        uuid            : "sdk_uuid"        ,
        sessionId       : "sdk_sid"         ,
        memberId        : "sdk_mid"         ,
        lastVisitTime   : "sdk_visit_time"  ,
        expires         : "expires"         ,
        path            : "path"            ,
        domain          : ""  //todo
    };


    //cookie文件操作工具类
    var cookieUtils = {
        genID: function () {
            var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
            var tmpid = [];
            var r;
            tmpid[8] = tmpid[13] = tmpid[18] = tmpid[23] = '-';
            tmpid[14] = '4';

            for (var i = 0; i < 36; i++) {
                if (!tmpid[i]) {
                    r = 0 | Math.random() * 16;
                    tmpid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
                }
            }
            return tmpid.join('');
        },


        //用于生成key对应的正则表达式，以用于匹配keyVal的字符串
        getRegKey: function (key) {
            return new RegExp("( |^)" + key + "=[^;]*(;|$)");
        },


        //设置value,key有则替换，没有则追加
        setValueByKey: function (key, value) {
            var exp = new Date();
            exp.setTime(exp.getTime() + conf.cookieExpires);
            var cookieText = key + "=" + encodeURIComponent(value);
            cookieText += ";" + cookieFields.expires + "=" + exp.toUTCString();
            cookieText += ";" + cookieFields.path + "=" + conf.cookiePath;
            document.cookie = cookieText;
        },

        //根据key从cookie中取val
        getValueByKey: function (key) {

            if (document.cookie.match(this.getRegKey(key)) !== null) {
                var keyVal = document.cookie.match(this.getRegKey(key))[0].toString().replace(";", "").replace(" ", "");
                if (keyVal.length <= key.length + 1) {
                    return ""
                } else {
                    var val = keyVal.split("=")[1];
                    return decodeURIComponent(val);
                }
            } else {
                return "";
            }
        },


        isCookieFileExists: function () {
            return this.getValueByKey(cookieFields.uuid) !== "";
        },

        createCookieFile: function () {
            this.setValueByKey(cookieFields.uuid, this.genID());
        },

        isSessionExists: function () {
            return this.getValueByKey(cookieFields.sessionId) !== "";
        },

        createSession: function () {
            this.setValueByKey(cookieFields.sessionId, this.genID());
            this.setValueByKey(cookieFields.lastVisitTime, new Date().getTime());

        },

        isSessionTimeOut: function () {
            if (this.getValueByKey(cookieFields.lastVisitTime) === "") {
                this.setValueByKey(cookieFields.lastVisitTime, 0);
                return true;
            } else {
                var now = new Date();
                now.setDate(now.getTime());
                return (now - this.getValueByKey(cookieFields.lastVisitTime)) > conf.sessionTimeOut
            }

        },

        updateLastVisitTime: function () {
            this.setValueByKey(cookieFields.lastVisitTime, new Date().getTime());
        }
    };


    //页面检测类
    var tracker = {
            //url请求字段
            logFields: {
                eventName            : "en"     ,
                version              : "ver"    ,
                platform             : "pl"     ,
                sdk                  : "sdk"    ,
                uuid                 : "u_ud"   ,
                memberId             : "u_mid"  ,
                sessionId            : "u_sd"   ,
                clientTime           : "c_time" ,
                language             : "l"      ,
                userAgent            : "b_iev"  ,
                resolution           : "b_rst"  ,
                currentUrl           : "p_url"  ,
                referrerUrl          : "p_ref"  ,
                title                : "tt"     ,
                orderId              : "oid"    ,
                orderName            : "on"     ,
                currencyAmount       : "cua"    ,
                currencyType         : "cut"    ,
                paymentType          : "pt"     ,
                category             : "ca"     ,
                action               : "ac"     ,
                kv                   : "kv_"    ,
                duration             : "du"
            },

            //字段值常量
            constants: {
                pageView             : "e_pv"   ,
                chargeRequestEvent   : "e_crt"  ,
                launch               : "e_l"    ,
                eventDurationEvent   : "e_e"
            },


            getBasicData: function () {
                var basic = "";
                basic += this.logFields.uuid          + "=" +    cookieUtils.getValueByKey(cookieFields.uuid)        + conf.sepInData;
                basic += this.logFields.sessionId     + "=" +    cookieUtils.getValueByKey(cookieFields.sessionId)   + conf.sepInData;
                basic += this.logFields.memberId      + "=" +    cookieUtils.getValueByKey(cookieFields.memberId)    + conf.sepInData;
                basic += this.logFields.clientTime    + "=" +    new Date().getTime()                                + conf.sepInData;
                basic += this.logFields.language      + "=" +    window.navigator.language                           + conf.sepInData;
                basic += this.logFields.userAgent     + "=" +    window.navigator.userAgent                          + conf.sepInData;
                basic += this.logFields.resolution    + "=" +    screen.width + "*" + screen.height                  + conf.sepInData;
                basic += this.logFields.version       + "=" +    conf.version                                        + conf.sepInData;
                basic += this.logFields.sdk           + "=" +    "js"                                                + conf.sepInData;
                basic += this.logFields.platform      + "=" +    "website"                                           + conf.sepInData;
                return basic;
            },


            sendDataToServer: function (dataStr) {
                // 发送数据data到服务器，其中data是一个字符串
                var im = new Image(1, 1);
                im.src = conf.requestUrl + dataStr;
                im.onerror = function () {
                    // 配置其他服务器地址
                };
            },


            onLaunch: function () {
                //要拼接log日志了
                var launchData = this.getBasicData();
                launchData += this.logFields.eventName + "=" + this.constants.launch;
                this.sendDataToServer(launchData);
            },


            onPageView: function () {
                var pageViewData = this.getBasicData();
                pageViewData += this.logFields.eventName     + "=" +    this.constants.pageView                      + conf.sepInData;
                pageViewData += this.logFields.currentUrl    + "=" +    encodeURIComponent(window.location.href)     + conf.sepInData;
                pageViewData += this.logFields.referrerUrl   + "=" +    encodeURIComponent(document.referrer)        + conf.sepInData;
                pageViewData += this.logFields.title         + "=" +    encodeURIComponent(document.title);
                this.sendDataToServer(pageViewData);
            },

//////////////////////////////////////
            onChargeRequest:function (orderId, name, currencyAmount, currencyType, paymentType) {
                var onChargeData = this.getBasicData();
                onChargeData += this.logFields.eventName       +"="+      this.constants.chargeRequestEvent         + conf.sepInData;


                this.sendDataToServer(onChargeData);

            },

        onChargeRequest: function(orderId, name, currencyAmount, currencyType, paymentType) {
            // 触发订单产生事件
            if (this.preCallApi()) {
                if (!orderId || !currencyType || !paymentType) {
                    this.log("订单id、货币类型以及支付方式不能为空");
                    return ;
                }

                if (typeof(currencyAmount) == "number") {
                    // 金额必须是数字
                    var time = new Date().getTime();
                    var chargeRequestEvent = {};
                    chargeRequestEvent[this.columns.eventName] = this.keys.chargeRequestEvent;
                    chargeRequestEvent[this.columns.orderId] = orderId;
                    chargeRequestEvent[this.columns.orderName] = name;
                    chargeRequestEvent[this.columns.currencyAmount] = currencyAmount;
                    chargeRequestEvent[this.columns.currencyType] = currencyType;
                    chargeRequestEvent[this.columns.paymentType] = paymentType;
                    this.setCommonColumns(chargeRequestEvent); // 设置公用columns
                    this.sendDataToServer(this.parseParam(chargeRequestEvent)); // 最终发送编码后的数据ss
                    this.updatePreVisitTime(time);
                } else {
                    this.log("订单金额必须是数字");
                    return ;
                }
            }
        },

        onEventDuration: function(category, action, map, duration) {
            // 触发event事件
            if (this.preCallApi()) {
                if (category && action) {
                    var time = new Date().getTime();
                    var event = {};
                    event[this.columns.eventName] = this.keys.eventDurationEvent;
                    event[this.columns.category] = category;
                    event[this.columns.action] = action;
                    if (map) {
                        for (var k in map){
                            if (k && map[k]) {
                                event[this.columns.kv + k] = map[k];
                            }
                        }
                    }
                    if (duration) {
                        event[this.columns.duration] = duration;
                    }
                    this.setCommonColumns(event); // 设置公用columns
                    this.sendDataToServer(this.parseParam(event)); // 最终发送编码后的数据ss
                    this.updatePreVisitTime(time);
                } else {
                    this.log("category和action不能为空");
                }
            }
        },
/////////////////////////////////////////////////////////////////////////////////////////////


            start: function () {
                if (cookieUtils.isSessionExists()) {
                    if (cookieUtils.isSessionTimeOut()) {
                        cookieUtils.createSession();
                        this.onPageView();
                    } else {
                        cookieUtils.updateLastVisitTime();
                        this.onPageView();
                    }
                } else if (cookieUtils.isCookieFileExists()) {
                    cookieUtils.createSession();
                    this.onPageView();
                } else {
                    cookieUtils.createCookieFile();
                    cookieUtils.createSession();
                    this.onLaunch();
                    this.onPageView();
                }
            }
        };


    window.__sdk__ = {
        start: function () {
            tracker.start();
        }
    };


    var autoLoad = function () {
        __sdk__.start();
    };


    autoLoad();


})();