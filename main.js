function getAllPropertyNames(o){
    var props=[]
    do props.push(...Object.getOwnPropertyNames(o))
    while (o=Object.getPrototypeOf(o))
    return props
}
function type(obj){
    return ({}).toString.call(obj).match(/\s([^\]]+)/)[1].toLowerCase()
}
module.exports=function(opts){
    if(opts===undefined) opts={}
    if(opts.log===undefined) opts.log=console.log
    if(opts.verbose===undefined) opts.verbose=true

    return function(req,res){
        var code="global."+(req.query.q||'').trim()
            ,intent="suggest"
            ,m
            ,startWith
        opts.log(code)

        if(m=code.match(/\.(\w*)$/)){
            startWith=m[1]
            code=code.replace(/\.\w*$/,'')
        }
        else if(code.match(/\(.*\)$/)){
            //hmm...do..not implement.
            intent="execute"
        }
        try{
            var it=(()=>{
                var parts=code.split(/\./)
                    ,at=global
                    ,next=parts.shift()
                do{
                    //cc("stepping",{at,next},"next is ",at[next])
                    at=at[next]
                    next=parts.shift()
                }
                while(at[next]!==undefined)
                return at
            })()
                , say = intent == "suggest" ? {
                    hints: getAllPropertyNames(it)
                        .filter(x => /*!x.match(/\b(prototype|caller|router|arguments|__.*__)\b/) &&*/ (startWith ? x.startsWith(startWith) : true))
                        //.slice(0,50)//...no...no more than that, please be one letter more specific
                        .map(propName => {
                            //console.log(x);
                            var r = {
                                text: propName
                                ,doc:[]
                                ,val:''
                                ,type:'?'
                                ,source:''
                            }
                            try {
                                var val=it[propName]
                                r.val = (val || '') + ''
                                r.type=type(val)
                                //if(r.val.match(/\[native code\] \}$/)) r.source=["native function"]
                                //failed, horrible attempt to jsdoc parse live. Consider for future.
                                /*
                                if(0 && r.type=='function'){
                                    if(!global.all){
                                        //store all code brought in
                                        global.all=_.keys(require.cache)
                                            .map(x=>require.cache[x].id)
                                            .filter(x=>x.match(/\.js/))
                                            .reduce((set,f)=>{
                                                set[f]={
                                                    code:fs.readFileSync(f).toString()
                                                    ,doc:""//jsDoc.renderSync({files:f,recurse:false})//defer till needed
                                                }
                                                return set
                                            },{})
                                        G.jsDoc=require("jsdoc-api")
                                    }
                                    var line=r.val.split(/\[native code\]/)[0].split("\n").slice(0,3)
                                        ,m=new RegExp([
                                                 _.escapeRegExp(line.join("\n")).replace(/\s+/,"\\s+")                //match 0,1,2
                                                ,_.escapeRegExp(line.slice(1,3).join("\n")).replace(/\s+/,"\\s+")    //or 1,2, since functions might not be assigned quite the way the top line says
                                            ].join("|")
                                            ,"gm")
                                    r.doc=[]
                                    r.source=_.keys(all).filter(k=>all[k].code.match(m))
                                        .map(k=>{
                                            //lazily jsDoc parse--don't do everything at once on load
                                            if(!all[k].doc){cc("jsDoc parsing",k)
                                                all[k].doc=jsDoc.explainSync({source:all[k].code,destination:"console"})
                                                    .reduce((set,part)=>{
                                                        if(part.name && !part.undocumented){
                                                            if(!_.isArray(set[part.name])) set[part.name]=[]
                                                            set[part.name].push(part)
                                                        }
                                                        return set
                                                    },{})
                                                cc("jsDoc parsing",k,"done")
                                            }
                                            var doc=all[k].doc[propName]
                                            if(doc) r.doc.push(...doc)
                                            return k.substr(k.indexOf("node_modules/"))
                                        })
                                }
                                */
                            } catch (e) {
                                opts.log(e)
                                r.val = '?'
                            }
                            return r
                        })
                } : intent == "execute" ? {
                    result: it
                } : {}
            }
        catch(e){ opts.log("Autocomplete error:",e) }

        if (!res.headersSent) {
            if (it === undefined) res.jsonp(false)
            else if (it.then) {
                it.then(reply => {
                    say.result = reply
                    res.jsonp(say)
                })
            } else res.jsonp(say)
        }
    }
}
