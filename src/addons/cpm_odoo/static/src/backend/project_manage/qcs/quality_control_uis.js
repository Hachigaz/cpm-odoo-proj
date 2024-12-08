/** @odoo-module **/
import { ItemList, ListFilter, SearchBar} from "../../components/components";
import { useService } from "@web/core/utils/hooks";
import { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate, formatDateTime, clearPageInfo, joinDatas, joinM2MDatas, formatSnakeStr} from "../../components/component_utils";
import { Component, onWillStart, onMounted, onWillUnmount, onWillDestroy, useEffect, useState, useRef} from "@odoo/owl";

class QualityControlOverviewPage extends Component{
    static page_name='cpm_odoo.ManagerOverviewPage'
    static template="cpm_odoo.ManagerOverviewPage"
    


}
class QualityControlActiveTasks extends ItemList{
    static page_name='cpm_odoo.QualityControlActiveTasks'
    static template="cpm_odoo.QualityControlActiveTasks"
    
    static components = {
        SearchBar,
        ListFilter
    }
    
    static formatSnakeStr = formatSnakeStr
    static formatDateTime = formatDateTime
    static formatDate = formatDate

    

    setup(){
        this.props.extra_domain=[
            ['project_id','=',this.props.context_data.project_id],
            ['workflow_id.workflow_status','=','active'],
            ['task_status','=','active']
        ]
        super.init()

        this.page_data.model_name = "cpm_odoo.planning_task"
        this.page_data.column_list = ['id','name','workflow_id','category_id','date_completed','priority','description','task_status','exp_end']
        this.page_data.order_by_str = "date_created asc, name asc"
        this.page_data.join_cols = [
            ['workflow_id','cpm_odoo.planning_workflow',['id','name']],
            ['category_id','cpm_odoo.planning_task_category',['id','name','color']]
        ]

        this.search_filter.search_bar.cols=['name']
        
        useEffect(()=>{
            this.page_data.extra_domain = this.props.extra_domain
        },
        ()=>[this.props.extra_domain])

        this.action=useService("action")

        this.filter_data=[
            {
                col_name:"priority",
                item_list:[
                    {
                        id:"normal",
                        name:"Normal"
                    },
                    {
                        id:"low",
                        name:"Low"
                    },
                    {
                        id:"medium",
                        name:"Medium"
                    },
                    {
                        id:"high",
                        name:"High"
                    },
                    {
                        id:"critical",
                        name:"Critical"
                    }
                ]
            }
        ]

        onWillStart(async ()=>{
            await this.loadData()
        })

        super.setup()
    }

    async loadData(){
        await this.loadFilterData()
    }

    async loadFilterData(){
        
    }
    
    async act_mark_completed(id){
        let result = await this.orm.call(
            "cpm_odoo.planning_task",
            "act_mark_completed",
            [
                id
            ]
        )

        if(result){
            window.location.reload()
        }
    }

    async act_reject_completion(id){
        await this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Reject Task Completion',
            res_model: 'cpm_odoo.planning_task_qa_rejection',
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'new',
            context:{
                'default_task_id':id,
                'default_category_id':2
            }
        });
    }
}

class QualityControlVerificationTaskPage extends ItemList{
    static page_name='cpm_odoo.QualityControlVerificationTaskPage'
    static template="cpm_odoo.QualityControlVerificationTaskPage"
    
    static components = {
        SearchBar,
        ListFilter
    }
    
    static formatSnakeStr = formatSnakeStr
    static formatDateTime = formatDateTime
    

    setup(){
        this.props.extra_domain=[
            ['project_id','=',this.props.context_data.project_id],
            ['task_status','=','completed']
        ]
        super.init()

        this.page_data.model_name = "cpm_odoo.planning_task"
        this.page_data.column_list = ['id','name','workflow_id','category_id','date_completed','priority','description','task_status']
        this.page_data.order_by_str = "date_created asc, name asc"
        this.page_data.join_cols = [
            ['workflow_id','cpm_odoo.planning_workflow',['id','name']],
            ['category_id','cpm_odoo.planning_task_category',['id','name','color']]
        ]

        this.search_filter.search_bar.cols=['name']
        
        useEffect(()=>{
            this.page_data.extra_domain = this.props.extra_domain
        },
        ()=>[this.props.extra_domain])

        this.action=useService("action")

        this.filter_data=[
            {
                col_name:"priority",
                item_list:[
                    {
                        id:"normal",
                        name:"Normal"
                    },
                    {
                        id:"low",
                        name:"Low"
                    },
                    {
                        id:"medium",
                        name:"Medium"
                    },
                    {
                        id:"high",
                        name:"High"
                    },
                    {
                        id:"critical",
                        name:"Critical"
                    }
                ]
            }
        ]

        onWillStart(async ()=>{
            await this.loadData()
        })

        super.setup()
    }

    async loadData(){
        await this.loadFilterData()
    }

    async loadFilterData(){
        
    }
    
    async act_mark_verified(id){
        await this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Verify Task',
            res_model: 'cpm_odoo.planning_task_qa_verification',
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'new',
            context:{
                'default_task_id':id,
                'default_category_id':2,
                'default_title':'Task Verification'
            }
        });
    }

    async act_reject_completion(id){
        await this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Reject Task Completion',
            res_model: 'cpm_odoo.planning_task_qa_rejection',
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'new',
            context:{
                'default_task_id':id,
                'default_category_id':2,
                'default_title':'Task Rejection'
            }
        });
    }
}

class QualityControlVerifiedTaskPage extends ItemList{
    static page_name='cpm_odoo.QualityControlVerifiedTaskPage'
    static template="cpm_odoo.QualityControlVerifiedTaskPage"
    
    static components = {
        SearchBar,
        ListFilter
    }
    
    static formatSnakeStr = formatSnakeStr
    static formatDateTime = formatDateTime
    

    setup(){
        this.props.extra_domain=[
            ['project_id','=',this.props.context_data.project_id],
            ['task_status','=','verified']
        ]
        super.init()

        this.page_data.model_name = "cpm_odoo.planning_task"
        this.page_data.column_list = ['id','name','workflow_id','category_id','date_completed','priority','description','task_status','date_verified','verification_id']
        this.page_data.order_by_str = "date_created asc, name asc"
        this.page_data.join_cols = [
            ['workflow_id','cpm_odoo.planning_workflow',['id','name']],
            ['category_id','cpm_odoo.planning_task_category',['id','name','color']],
            ['verification_id','cpm_odoo.planning_task_qa_verification',['id','completion_quality']]
        ]

        this.search_filter.search_bar.cols=['name']
        
        useEffect(()=>{
            this.page_data.extra_domain = this.props.extra_domain
        },
        ()=>[this.props.extra_domain])

        this.action=useService("action")

        this.filter_data=[
            {
                col_name:"priority",
                item_list:[
                    {
                        id:"normal",
                        name:"Normal"
                    },
                    {
                        id:"low",
                        name:"Low"
                    },
                    {
                        id:"medium",
                        name:"Medium"
                    },
                    {
                        id:"high",
                        name:"High"
                    },
                    {
                        id:"critical",
                        name:"Critical"
                    }
                ]
            }
        ]

        onWillStart(async ()=>{
            await this.loadData()
        })

        super.setup()
    }

    async loadData(){
        await this.loadFilterData()
    }

    async loadFilterData(){
        
    }
}

export class QualityControlUI extends Component{
    static page_name='cpm_odoo.QualityControlUI'
    static template="cpm_odoo.QualityControlUI"
    static components = {
        QualityControlOverviewPage,
        QualityControlVerificationTaskPage,
        QualityControlVerifiedTaskPage
    };
    
    get pageComponent() {
        const renderPage = this.constructor.availablePages.find(page => page.id === this.currentPage);
        return renderPage.page
    }

    static availablePages = [
        // {
        //     id:QualityControlOverviewPage.page_name,
        //     name:"Overview",
        //     page:QualityControlOverviewPage,
        //     group_id:""
        // },
        {
            id:QualityControlActiveTasks.page_name,
            name:"Active Tasks",
            page:QualityControlActiveTasks,
            group_id:""
        },
        {
            id:QualityControlVerificationTaskPage.page_name,
            name:"Pending Tasks",
            page:QualityControlVerificationTaskPage,
            group_id:""
        },
        {
            id:QualityControlVerifiedTaskPage.page_name,
            name:"Verified Tasks",
            page:QualityControlVerifiedTaskPage,
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