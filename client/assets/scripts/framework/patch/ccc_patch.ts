import { assetManager, director, game, gfx, Node, path, sp, sys, __private, AssetManager, settings } from "cc";
import { ALIPAY, EDITOR, MINIGAME } from "cc/env";
import { UIConfig } from "fairygui-cc";

// 解决fairygui层级不一致造成mask异常问题
if(!EDITOR) {
    var layer2D = UIConfig.defaultUILayer;
    var setParent = Node.prototype.setParent;
    Node.prototype.setParent = function (value: any, keepWorldTransform?: boolean) {
        let that = this as Node;
        setParent.call(that, value, keepWorldTransform);
        if(value && value.$gobj && value.layer == layer2D) {
            that.layer = value.layer;
        }
    }
}

// let tiledTileOnEnable = TiledTile.prototype.onEnable;
// TiledTile.prototype.onEnable = function () {
//     let that = this as TiledTile;
//     tiledTileOnEnable.call(that);
    
//     let trans = that.node.getComponent(UITransform);
//     trans.anchorY = 0;   
// }

export var PackageVersionMap = {};
export var clearUselessCache = function (version: string) {

};

if(MINIGAME) {
    if(typeof wx != 'undefined' && wx.onMemoryWarning){
        wx.onMemoryWarning && wx.onMemoryWarning(() => {
            wx.triggerGC();
            console.log("内存警告");
        });
    }

    //@ts-ignore
    const { fs } = window.fsUtils;
    
  	const ASSET_MGR_REGEX = /^https?:\/\/.*/;
    const cacheManager = assetManager.cacheManager;
    const downloader = assetManager.downloader;
    const downloadJson = downloader["_downloaders"][".json"];
    const downloadBundle = downloader["_downloaders"]["bundle"];

    const subpackages = {};
    const subpacks = settings.querySettings('assets', 'subpackages');
    subpacks && subpacks.forEach((x) => subpackages[x] = `subpackages/${x}`);

    function existsAsync(file: string) {
        try { 
            fs.accessSync(file);
            return true;         
        } catch (e) {         
            return false;         
        }
    } 

    // 重写文件创建方法，需要提前写，否则取出来的是原始方法
    //@ts-ignore
    const makeDirSync = window.fsUtils.makeDirSync = function (path, recursive) {
        try {
            if(!existsAsync(path)) {
                fs.mkdirSync(path, recursive);
            }
            return null;
        }
        catch (e) {
            console.warn(`Make directory failed: path: ${path} message: ${e.message}`);
            return new Error(e.message);
        }
    }
    
    //@ts-ignore
    const { downloadFile, readText, readArrayBuffer, readJson, loadSubpackage, getUserDataPath, exists,unzip, rmdirSync,isOutOfStorage } = window.fsUtils;

    //@ts-ignore
    const unzipCacheBundle = cacheManager.unzipAndCacheBundle;

    //@ts-ignore
    cacheManager.makeBundleFolder = function(bundleName) {
        let dir = this.cacheDir + '/' + bundleName;
        if(!existsAsync(dir)) {
            //@ts-ignore
            makeDirSync(dir, true);
        }
    }

    function copyDirsSync(srcDir, destDir) {
        let files = fs.readdirSync(srcDir);
        files.forEach((filename) => {
            let srcPath = path.join(srcDir, filename);
            let destPath = path.join(destDir, filename);
            let stat = fs.statSync(srcPath);
            if (stat.isFile()) {
                fs.copyFileSync(srcPath, destPath);
            } else if (stat.isDirectory()) {
                if(!existsAsync(destPath)) {
                    makeDirSync(destPath, true);
                }
                copyDirsSync(srcPath, destPath);
            }
        });
    }

    // /**
    //  * 有些平台的解压目录最后必须带一个/【比如美团】，有些不会，支付宝末尾不支持双斜杠
    //  */
    var suffix = 0;
    //@ts-ignore
    cacheManager.unzipAndCacheBundle = function (id, zipFilePath, cacheBundleRoot, onComplete, targetPath:string = null) {
        // 只有美团ios需要处理下解压路径，其他平台走引擎默认逻辑
        if(!ALIPAY) {
            unzipCacheBundle.call(this, id, zipFilePath, cacheBundleRoot, onComplete, targetPath);
            return;
        }

        let needCopy = true;
        if (!targetPath) {
            needCopy = false;
            let time = Date.now().toString();
            targetPath = "".concat(this.cacheDir, "/").concat(cacheBundleRoot, "/").concat(time).concat("" + suffix++).concat("/");
        }

        let time = Date.now().toString();
        let self = this;

        let tempDir = needCopy ? (targetPath + '/temp_' + time + (suffix++) + "/") : (targetPath.endsWith("/") ? targetPath : targetPath + "/");
        makeDirSync(tempDir, true);
        unzip(zipFilePath, tempDir, function (err) {
            if (err) {
                rmdirSync(targetPath, true);
                if(needCopy) {
                    rmdirSync(tempDir, true);
                }
                if (isOutOfStorage(err.message)) {
                    self.outOfStorage = true;
                    self.autoClear && self.clearLRU();
                }
                self.cachedFiles.remove(id);
                onComplete && onComplete(err);
                return;
            } else {
                // copy to real dir
                if(needCopy) {
                    copyDirsSync(tempDir, targetPath);
                    rmdirSync(tempDir, true);
                }
                self.cachedFiles.add(id, { bundle: cacheBundleRoot, url: targetPath, lastTime: time });
            }
            self.writeCacheFile();
            onComplete && onComplete(null, targetPath);
        });
    }

    function handleZip (url, options, onComplete) {
        let cachedUnzip = cacheManager.cachedFiles.get(url);
        if (cachedUnzip) {
            //@ts-ignore
            cacheManager.updateLastTime(url);
            onComplete && onComplete(null, cachedUnzip.url);
        }
        else if (ASSET_MGR_REGEX.test(url)) {
            console.log(`unzip file ${url}`);

            downloadFile(url, null, options.header, options.onFileProgress, function (err, downloadedZipPath) {
                if (err) {
                    console.error(`download ${url} failed : ${err.message}`);
                    onComplete && onComplete(err);
                    return;
                }
                //@ts-ignore
                cacheManager.unzipAndCacheBundle(url, downloadedZipPath, options.__cacheBundleRoot__, onComplete); //, options?._targetPath);
            });
        }
        else {
            //@ts-ignore
            cacheManager.unzipAndCacheBundle(url, url, options.__cacheBundleRoot__, onComplete); //, options?._targetPath);
        }
    }

    assetManager.downloader.register("bundle", (nameOrUrl, options, onComplete) => {
        console.log("bundle", nameOrUrl, options);

        let pkg = PackageVersionMap[nameOrUrl];
        if(!pkg) {
            downloadBundle(nameOrUrl, options, onComplete);
            return;
        }

        let bundleName = path.basename(nameOrUrl);
        let version = options.version || assetManager.downloader.bundleVers[bundleName];
        let suffix = version ? version + '.' : '';

        let localVersion = assetManager.downloader.bundleVers[bundleName];
        let localSuffix = localVersion ? localVersion + '.' : '';

        function getConfigPathForSubPackage () {
            if (sys.platform === sys.Platform.TAOBAO_MINI_GAME) {
                return `${bundleName}/config.${suffix}json`;
            }
            return `subpackages/${bundleName}/config.${localSuffix}json`;
        }

        function appendBaseToJsonData (data) {
            if (!data) return;
    
            if (sys.platform === sys.Platform.TAOBAO_MINI_GAME) {
                data.base = `${bundleName}/`;
            } else {
                data.base = `subpackages/${bundleName}/`;
            }
        }

        // @ts-ignore
        if (subpackages[bundleName]) {
            const config = getConfigPathForSubPackage();
            loadSubpackage(bundleName, options.onFileProgress, (err) => {
                if (err) {
                    onComplete(err, null);
                    return;
                }
                downloadJson(config, options, (err, data) => {
                    appendBaseToJsonData(data);
                    onComplete(err, data);
                });
            });
        }
        else {
            let js; let url;
            if (ASSET_MGR_REGEX.test(nameOrUrl) || nameOrUrl.startsWith(getUserDataPath())) {
                url = nameOrUrl;
                js = `src/bundle-scripts/${bundleName}/index.${localSuffix}js`;
                // @ts-ignore
                cacheManager.makeBundleFolder(bundleName);
            } else if (downloader.remoteBundles.indexOf(bundleName) !== -1) {
                url = `${downloader.remoteServerAddress}remote/${bundleName}`;
                js = `src/bundle-scripts/${bundleName}/index.${localSuffix}js`;
                // @ts-ignore
                cacheManager.makeBundleFolder(bundleName);
            } else {
                url = `assets/${bundleName}`;
                js = `assets/${bundleName}/index.${localSuffix}js`;
            }

            try{
                // 自己重写的require js后，加载地址不一样了，需要处理一下
                if (sys.platform === sys.Platform.TAOBAO_MINI_GAME) {
                    // @ts-ignore
                    require(`/../../${js}`);
                } else if (sys.platform !== sys.Platform.TAOBAO_CREATIVE_APP) { // Can't load scripts dynamically on Taobao platform
                    // @ts-ignore
                    require(`../../${js}`);
                }
            } catch (e) {
                console.error("require error:" + e);
            }

            options.__cacheBundleRoot__ = bundleName;
            const config = `${url}/config.${suffix}json`;
            downloadJson(config, options, function (err, data) {
                if (err) {
                    onComplete && onComplete(err);
                    return;
                }
                if (data.isZip) {
                    let zipVersion = data.zipVersion;
                    let zipUrl = getZipUrl(pkg, url, zipVersion);
                    console.log(`zipUrl: ${zipUrl}`);
                    handleZip(zipUrl, options, (err, unzipPath) => {
                        if (!err) {
                            data.base = unzipPath + '/res/';
                            // PATCH: for android alipay version before v10.1.95 (v10.1.95 included)
                            // to remove in the future
                            if (sys.platform === sys.Platform.ALIPAY_MINI_GAME && sys.os === sys.OS.ANDROID) {
                                let resPath = unzipPath + 'res/';
                                if (fs.accessSync({ path: resPath })) {
                                    data.base = resPath;
                                }
                            }

                            if (!options) {
                                options = {};
                            }
                            options._targetPath = unzipPath;
                        } else {
                            console.error(err);
                        }
                        onComplete && onComplete(err, data);
                    });
                }
                else {
                    data.base = url + '/';
                    onComplete && onComplete(null, data);
                }
            });
        }
    });

    function getZipUrl(pkg:any, url: string, zipVersion: string) {
        let defaultUrl = `${url}/res.${zipVersion ? zipVersion + '.' : ''}zip`;
        if(!pkg || typeof(pkg) !== 'object' || pkg.formats == null || pkg.formats.length === 0) {
            return defaultUrl;
        }

        let device = director.root.device;
        let ext = "";
        if(device) {
            for(let i=0;i<pkg.formats.length;i++) {
                let tmpExt = pkg.formats[i];
                if (tmpExt === 'astc' && device.getFormatFeatures(gfx.Format.ASTC_RGBA_4X4)) {
                    ext = ".astc";
                    break;
                }else if (tmpExt === 'pvr' && (device.getFormatFeatures(gfx.Format.PVRTC_RGB2) || device.getFormatFeatures(gfx.Format.PVRTC_RGBA2))) {
                    ext = ".pvr";
                    break;
                }else if (tmpExt === 'pkm' && device.getFormatFeatures(gfx.Format.ETC_RGB8)) {
                    ext = ".pkm";
                    break;
                }else if (tmpExt === 'webp' && sys.hasFeature(sys.Feature.WEBP)) {
                    ext = ".webp";
                    break;
                }
            }
        }

        // if no suitable format found, use default format
        if(!ext) {
            return defaultUrl;
        }

        return `${url}/res.${(zipVersion ? zipVersion : '') + ext + "."}zip`;
    }

    function clearUselessCacheF(version: string) {
        console.log("clearUselessCache", version);

        let caches = assetManager.cacheManager.cachedFiles;
        let curVersion = `/${version}/`;
        let versionRegex = /\/((debug\d?)|((\d.*?\.?){1,4}))\//gi;
        // 移除所有hash不在PackageVersionMap中的缓存
        let regex = /https?:\/\/.*?\/remote\/(.*?)\/.*?/gi;
        caches.forEach((value, key) => {
            let arr = regex.exec(key);
            if (value && key && arr && arr.length > 1 && arr[1]) {
                let exits = false;
                // console.log("check cache:", key, value.url, value.bundle);

                let pkgName = arr[1];
                let dotSplits = key.split(".");
                let hashValue = dotSplits[dotSplits.length - 2]; // xxxx.hash.ext

                var pkg = PackageVersionMap[pkgName];
                if (pkg) {
                    if (pkg == hashValue) {
                        exits = true;
                    } else if(pkg.files) {                        
                        let fn = path.basename(key);
                        if(!!pkg.files[fn]) {
                            exits = true;
                        }
                    } else {
                        exits = pkg.hash == hashValue || pkg.zipHash == hashValue;
                    }
                }
    
                if (!exits) {
                    console.log("删除:", value.url, key)
                    assetManager.cacheManager.removeCache(key);
                } else if (key.indexOf(curVersion) < 0) {
                    console.log("替换:", value.url, key)
                    assetManager.cacheManager.cachedFiles.remove(key);
                    assetManager.cacheManager.cachedFiles.add(key.replace(versionRegex, curVersion), value);
                }
            }
        });
    
        assetManager.cacheManager["writeCacheFile"]();
    }

    clearUselessCache = clearUselessCacheF;
}

export default null;