export class StringUtils {    
    /**
     * 获取字符长度
     * @param str 
     * @returns 
     */
    public static strlen(str: string) {
        var len = 0;
        for (var i = 0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            //单字节加1
            if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
                len++;
            }
            else {
                len += 2;
            }
        }
        return len;
    }
    /**
     * 字符串超过n个字符转换成...
     * @param str 
     * @param cropping 
     */
    public static strConvert(str: string, cropping: number) {
        var len = 0;
        let index = -1;
        if (str.length < cropping) {
            return str;
        }
        for (var i = 0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            //单字节加1
            if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
                len++;
            }
            else {
                len += 2;
            }
            if (len > cropping * 2) {
                index = i;
                break;
            }
        }
        if (index > -1) {
            return str.substring(0, index) + "..."
        }
        return str;
    }

    static compareVersion(ver1: string, ver2: string) {
        const v1 = ver1.split('.');
        const v2 = ver2.split('.');
        const len = Math.max(v1.length, v2.length);

        while (v1.length < len) { v1.push('0'); }
        while (v2.length < len) { v2.push('0'); }

        for (let i = 0; i < len; i++) {
            const n1 = parseInt(v1[i]);
            const n2 = parseInt(v2[i]);

            if (n1 != n2) {
                return n1 > n2 ? 1 : -1;
            }
        }

        return 0;
    } 

    static padding(num: number, len: number, char: string = "0") {
        let str = num.toString();
        while(str.length < len) {
            str = char + str;
        }
        return str;
    }

    static format(source: string, ...params: (string|number|boolean)[]) {
        if(!source) {
            return source;
        }

        params.forEach((val, idx) => {
            source = source.replace(new RegExp("\\{" + idx + "\\}", "g"), val?.toString());
        });
        return source;
    };  

    static splitResPath(path: string, defaultPkg: string): { pkg: string, res: string } {
        let res = path;
        let pkg = defaultPkg;
        if(path.startsWith("db://")) {
            path = path.substring(5);
            let idx = path.indexOf("/");
            pkg = path.substring(0, idx);   
            res = path.substring(idx + 1);         
        }
        return { pkg, res };
    }

    public static randomFuncName(len) {
        var str = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var s = "";

        var random = function(){
            var rand = Math.floor(Math.random() * str.length);
            return str.charAt(rand);
        };

        s += random();
        str += '0123456789';
        for(var i = 0; i < len - 1; i++){
            s += random();
        }
        return s;
    }

    static randomString(len: number) {
        len = len || 32;
        var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
        var maxPos = $chars.length;
        var pwd = '';
        for (let i = 0; i < len; i++) {
            pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
        }
        return pwd;
    }

    static stringToColor(color:string):number[]{
        let r = parseInt(color.substr(1,2),16);
        let g = parseInt(color.substr(3,2),16);
        let b = parseInt(color.substr(5,2),16);

        return [r,g,b];
    }
}