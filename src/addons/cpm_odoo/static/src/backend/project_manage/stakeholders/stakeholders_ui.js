/** @odoo-module **/
import { ItemList, ListFilter, SearchBar} from "../../components/components";
import { useService } from "@web/core/utils/hooks";
import { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate, formatDateTime, clearPageInfo, joinDatas, joinM2MDatas, formatSnakeStr} from "../../components/component_utils";
import { Component, onWillStart, onMounted, onWillUnmount, onWillDestroy, useEffect, useState, useRef} from "@odoo/owl";

class ProjectInvestorPage extends Component{
    static page_name='cpm_odoo.ProjectInvestorPage'
    static template="cpm_odoo.ProjectInvestorPage"
    static components = {
    }
    

    setup(){
        this.orm=useService("orm")
        this.action=useService("action")
        
        onWillStart(async()=>{
            await this.loadData()
        })
    }

    async loadData(){
        let project_rec = await this.orm.call(
            "cpm_odoo.root_project",
            "search_read",
            [
                [
                    ["id",'=',this.props.context_data.project_id]
                ],
                ['investor_ids']
            ]
        )

        project_rec = project_rec[0]
        this.investor_list = await this.orm.call(
            "cpm_odoo.stakeholders_investor",
            "search_read",
            [
                [
                    ["id",'in',project_rec.investor_ids]
                ]
            ]
        )
    }
}

class ProjectOtherContactPage extends Component{
    static page_name='cpm_odoo.ProjectOtherContactPage'
    static template="cpm_odoo.ProjectOtherContactPage"
    static components = {
    }
    

    setup(){
        this.orm=useService("orm")
        this.action=useService("action")
        
        onWillStart(async()=>{
            await this.loadData()
        })
    }

    async loadData(){
        let project_rec = await this.orm.call(
            "cpm_odoo.root_project",
            "search_read",
            [
                [
                    ["id",'=',this.props.context_data.project_id]
                ],
                ['other_contact_ids']
            ]
        )

        project_rec = project_rec[0]
        this.other_contact_list = await this.orm.call(
            "cpm_odoo.stakeholders_other_contacts",
            "search_read",
            [
                [
                    ["id",'in',project_rec.other_contact_ids]
                ]
            ]
        )
    }
}

export class StakeholdersUI extends Component{
    static page_name='cpm_odoo.StakeholdersUI'
    static template="cpm_odoo.StakeholdersUI"
    static components = {
        ProjectInvestorPage,
        ProjectOtherContactPage
    };
    
    get pageComponent() {
        const renderPage = this.constructor.availablePages.find(page => page.id === this.currentPage);
        return renderPage.page
    }

    static availablePages = [
        {
            id:ProjectInvestorPage.page_name,
            name:"Investors",
            page:ProjectInvestorPage,
            group_id:""
        },
        {
            id:ProjectOtherContactPage.page_name,
            name:"Other Contacts",
            page:ProjectOtherContactPage,
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