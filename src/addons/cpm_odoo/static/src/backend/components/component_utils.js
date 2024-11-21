/** @odoo-module **/
export function storePageContext(context){
    sessionStorage.setItem("pageContext",JSON.stringify(context))
}

export function getPageContext(){
    if(sessionStorage.getItem("pageContext")){
        return JSON.parse(sessionStorage.getItem("pageContext"))
    }
    else{
        return false
    }
}

export function moveToPage(page_id,subpage_id){
    let pageContext = getPageContext()

    if(page_id!==false){
        pageContext.page_id = page_id
    }
    if(subpage_id!==false){
        pageContext.subpage_id = subpage_id
    }

    storePageContext(pageContext)
    location.reload()
}


export function storePageInfo(page_name,data){
    data.page_name = page_name
    sessionStorage.setItem(`page_info:${page_name}`,JSON.stringify(data))
}

export function getPageInfo(page_name){
    let pageInfo = sessionStorage.getItem(`page_info:${page_name}`) 
    if(pageInfo){
        let data = JSON.parse(pageInfo)
        if(data.page_name===page_name){
            return data
        }
        else{
            return undefined
        }
    }
    else{
        return undefined
    }
}

export function clearPageInfo(page_name){
    sessionStorage.removeItem(`page_info:${page_name}`) 
}

export function formatDate(date_str){
    const inputDate = date_str;

    // Split the date string (DD-MM-YYYY)
    const [year, month, day] = inputDate.split('-');
    // Create a new Date object (months are zero-based in JavaScript, so subtract 1)
    const date = new Date(`${year}-${month}-${day}`);

    // Format the date to 'MMM DD YYYY' (e.g., 'Jun 19 2025')
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short', // Jun
        day: 'numeric', // 19
        year: 'numeric' // 2025
    });

    return formattedDate
}

export function formatDateTime(dt_str){
    dt_str = dt_str.split(" ")
    const inputDate = dt_str[0];
    let time_str = dt_str[1].split(":")

    // Split the date string (DD-MM-YYYY)
    const [year, month, day] = inputDate.split('-');

    return `${time_str[0]}:${time_str[1]} ${day}/${month}/${year}`
}

export async function joinDatas(list,orm,cols){
    
    for (const col of cols){

        let ids = []
        list.forEach((rec)=>{
            let col_names = col[0].split(".")
            let item = rec;
            if(col_names.length>1){
                const lastKey = col_names.pop();
                for (const name of col_names){
                    item = item[name]
                    if(!item){
                        break;
                    }
                }
                if(item){
                    if(item[lastKey]){
                        ids.push(item[lastKey][0])
                    }
                }
            }
            else{
                col_names = col_names[0]
                ids.push(item[col_names][0])
            }
        })
    
        const recs = await orm.call(
            col[1],
            "search_read",
            [
                [
                    ['id','in',ids]
                ],
                col[2]?col[2]:[],
                0,0,
                ""
            ]
        )

        list.forEach((rec,idx)=>{
            let col_names = col[0].split(".")
            let item = list[idx];
            if(col_names.length>1){
                const lastKey = col_names.pop();
                for (const name of col_names){
                    item = item[name]
                    if(!item){
                        break;
                    }
                }
                if(item){
                    item[lastKey] = recs.find(col_rec=>col_rec.id===item[lastKey][0])
                }
            }
            else{
                col_names = col_names[0]
                item[col_names] = recs.find(col_rec=>col_rec.id===item[col_names][0])
            }
        })
    }

    // console.log(list)
}