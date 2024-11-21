/** @odoo-module **/
import { useService } from "@web/core/utils/hooks";
import { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate, formatDateTime} from "../components/component_utils";
import { Component, onWillStart, onMounted, useEffect, useState, useRef} from "@odoo/owl";

// export class ProjectPlanningPage extends Component {
//     static page_name = "ProjectPlanningPage"
//     static template = "cpm_odoo.ProjectPlanningPage";
//     static components = {
//         PlanningOverview,
//         PlanningWorkflows,
//         PlanningDrafts,
//         PlanningUnassignedTasks
//     }
    
//     get subpageComponent() {
//         const renderPage = this.availablePages.find(page => page.id === this.currentPage);
//         return renderPage.page
//     }

//     availablePages = [
//         {
//             id: "overview",
//             name:"Overview",
//             page:PlanningOverview,
//             group_id:"cpm_view_project_plans"
//         },
//         {
//             id: "workflow",
//             name:"Workflows",
//             page:PlanningWorkflows,
//             group_id:"cpm_manage_project_plans"
//         },
//         {
//             id: "manage_workflow",
//             name:"Manage Workflow",
//             page:PlanningManageWorkflow,
//             group_id:"cpm_manage_project_plans",
//             disabled:getPageInfo(PlanningManageWorkflow.page_name)?false:true
//         },
//         {
//             id: "manage_task",
//             name:"Manage Task",
//             page:PlanningManageTask,
//             group_id:"cpm_manage_project_plans",
//             disabled:getPageInfo(PlanningManageTask.page_name)?false:true
//         }
//     ]

//     setup(){
//         this.currentPage = getPageContext().subpage_id;
//         if (this.currentPage == null){
//             this.currentPage=this.availablePages[0].id
//         }
//     }


//     async callSubPage(id) {
//         moveToPage(false,id)
//     }
// }