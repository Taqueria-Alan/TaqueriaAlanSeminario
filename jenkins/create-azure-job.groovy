import jenkins.model.Jenkins
import hudson.plugins.git.GitSCM
import hudson.plugins.git.BranchSpec
import org.jenkinsci.plugins.workflow.job.WorkflowJob
import org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition

// Idempotent bootstrap for a new preparation job. Existing jobs are preserved.
def instance = Jenkins.get()
def jobName = 'Taqueria-Azure-Preparacion'
if (instance.getItem(jobName) == null) {
    def scm = new GitSCM('https://github.com/Taqueria-Alan/TaqueriaAlanSeminario.git')
    scm.branches = [new BranchSpec('*/deploy/azure-presentation')]
    def definition = new CpsScmFlowDefinition(scm, 'Jenkinsfile.azure')
    definition.lightweight = true
    def job = instance.createProject(WorkflowJob, jobName)
    job.description = 'Preparacion Azure. DEPLOY_AZURE desactivado por defecto; publicar requiere main revisada y credencial especifica.'
    job.definition = definition
    job.save()
    job.scheduleBuild2(10)
    println('AZURE_PREPARATION_JOB_CREATED')
} else {
    println('AZURE_PREPARATION_JOB_EXISTS_UNCHANGED')
}
