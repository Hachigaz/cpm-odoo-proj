/** @odoo-module **/
import { ItemList, SearchBar} from "../../components/components";
import { useService } from "@web/core/utils/hooks";
import { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate, formatDateTime, clearPageInfo, joinDatas, joinM2MDatas, formatSnakeStr} from "../../components/component_utils";
import { Component, onWillStart, onMounted, onWillUnmount, onWillDestroy, useEffect, useState, useRef} from "@odoo/owl";

class ManagerOverviewPage extends Component{
    static page_name='cpm_odoo.ManagerOverviewPage'
    static template="cpm_odoo.ManagerOverviewPage"
    
}

export class ProjectManagerUI extends Component{
    static page_name='cpm_odoo.ProjectManagerUI'
    static template="cpm_odoo.ProjectManagerUI"
    static components = {
        ManagerOverviewPage
    };
    
    get pageComponent() {
        const renderPage = this.constructor.availablePages.find(page => page.id === this.currentPage);
        return renderPage.page
    }

    static availablePages = [
        {
            id:ManagerOverviewPage.page_name,
            name:"Overview",
            page:ManagerOverviewPage,
            group_id:""
        }
    ]

    setup(){
        this.currentPage = getPageContext().subpage_id;
        if (this.currentPage == null){
            this.currentPage=this.constructor.availablePages[0].id
        }
        
    }


    async callSubPage(id) {
        moveToPage(false,id)
    }
}