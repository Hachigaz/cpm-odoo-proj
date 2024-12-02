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
    sessionStorage.setItem("pageExtraData",JSON.stringify(data))
}

export function getPageInfo(page_name){
    if(sessionStorage.getItem("pageExtraData")){
        let data = JSON.parse(sessionStorage.getItem("pageExtraData"))
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

export function formatSnakeStr(str){
    return str
    .split('_') // Split the string by underscores
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
    .join(' '); // Join the words back together with spaces
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

export function categorizeDate(dateString) {
    const inputDate = new Date(dateString);
    const now = new Date();
    
    // Normalize the dates to ignore the time part
    const today = new Date(now.setHours(0, 0, 0, 0));
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Set the current date to the start of the week (Sunday)
    const startOfThisWeek = new Date(new Date(today).setDate(today.getDate() - today.getDay()));
    const startOfNextWeek = new Date(startOfThisWeek);
    startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);
    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(endOfNextWeek.getDate() + 6);
    
    // Check for "Today"
    if (inputDate >= today && inputDate < tomorrow) {
        return "Today";
    }
    // Check for "Tomorrow"
    if (inputDate >= tomorrow && inputDate < new Date(tomorrow).setHours(24, 0, 0, 0)) {
        return "Tomorrow";
    }
    // Check if it's in the past today
    if (inputDate < today) {
        return "Passed today";
    }
    // Check for "This week"
    if (inputDate >= startOfThisWeek && inputDate < startOfNextWeek) {
        return "This week";
    }
    // Check for "Next week"
    if (inputDate >= startOfNextWeek && inputDate <= endOfNextWeek) {
        return "Next week";
    }
    // Otherwise, it's "Other"
    return "Other";
}

export async function joinDatas(list,orm,cols){
    let col_recs = []
    
    for (const col of cols){
        const ids = [...new Set(list.map(rec => rec[col[0]][0]))]
    
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

        col_recs.push(recs)
    }
}


export async function joinM2MDatas(list,orm,col){
    for (const [idx,rec] of list.entries()){
        list[idx][col[0]] = await orm.call(
            col[1],
            "search_read",
            [
                [
                    ['id','in',list[idx][col[0]]]
                ],
                col[2],0,0,""
            ]
        )
    }
}

export async function isInGroup(user_id,gr_xml_id,orm){
    let result = await orm.call(
        "res.users",
        "has_group",
        [
            gr_xml_id
        ]
    )
    return result
}
