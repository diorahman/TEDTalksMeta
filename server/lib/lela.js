/*
    Parallel arguments
*/

function lela(fn, args, cb_){
        var n = args.length,
                results = [],
                errState = null
        
        function cb(er, data){
                if(errState) return 
                if(er) return cb(errState = er)
                        results.push(data);
                if(--n === 0)
                        cb_(null, results)
        }
        
        function toArray(obj){
                var arr = [];
                for(var i in obj){
                        arr.push(obj[i]);
                }
                return arr;
        }
        
        args.forEach(function(arg){
                var a = toArray(arg);
                a.push(cb);
                fn.apply(this, a);
        });
}

if (typeof module !== 'undefined' && "exports" in module) {
  module.exports = lela;
}