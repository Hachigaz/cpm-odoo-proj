/** @odoo-module **/
import { GanttDisplay, ItemList, SearchBar} from "../../components/components";
import { useService } from "@web/core/utils/hooks";
import { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate, formatDateTime, joinDatas} from "../../components/component_utils";
import { Component, onWillStart, onMounted, useEffect, useState, useRef} from "@odoo/owl";



export async function processTransactionList(list,orm){


    await joinDatas(list,orm,
        [
            ["cur_id","res.currency"]
        ]
    )
    
    list.forEach((trans,idx)=>{
        list[idx].d_amount = formatCurrency(trans.amount,trans.cur_id)

        let status_name = list[idx].status
          .split('_') // Split the string by underscores
          .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
          .join(' '); // Join the words back together with spaces

        list[idx].status = [list[idx].status, status_name]
    })
}

export function formatCurrency(val,cur_id){
    const { symbol, position, decimal_places } = cur_id;
    const int = val.toLocaleString()
    let dec = val.toFixed(decimal_places).split(".")[1]
    dec = dec?"."+dec:""

    return position === 'before' ? `${symbol} ${int}${dec}` : `${int}${dec} ${symbol}`
}