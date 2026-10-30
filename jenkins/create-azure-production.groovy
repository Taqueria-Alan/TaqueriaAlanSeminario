import jenkins.model.Jenkins
import com.cloudbees.hudson.plugins.folder.Folder
import com.cloudbees.plugins.credentials.CredentialsProvider
import com.cloudbees.plugins.credentials.CredentialsScope
import com.cloudbees.plugins.credentials.SecretBytes
import com.cloudbees.plugins.credentials.domains.Domain
import org.jenkinsci.plugins.plaincredentials.impl.FileCredentialsImpl
import groovy.json.JsonSlurper
import hudson.plugins.git.GitSCM
import hudson.plugins.git.BranchSpec
import hudson.model.ParametersAction
import hudson.model.BooleanParameterValue
import org.jenkinsci.plugins.workflow.job.WorkflowJob
import org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition

// Run once during Jenkins startup after the encrypted credential transfer.
// No authentication settings, roles, or existing credentials are changed.
def instance = Jenkins.get()
def folder = instance.getItem('TaqueriaAzure')
if (folder == null) folder = instance.createProject(Folder, 'TaqueriaAzure')
assert folder instanceof Folder

def store = CredentialsProvider.lookupStores(folder).find { it.context == folder }
assert store != null : 'Folder credential store unavailable'
def domain = Domain.global()
if (!store.getCredentials(domain).any { it.id == 'azure-taqueria-sp' }) {
    def privateFile = new File('/tmp/taqueria-azure-transport/azure-sp.json')
    assert privateFile.exists() : 'Private credential transfer missing'
    byte[] bytes = privateFile.bytes
    def data = new JsonSlurper().parse(bytes)
    assert data.subscriptionId == '2665af54-7e11-4031-ae76-1ebe75e1a326'
    assert data.clientId == 'a453d4a1-8aae-415c-82a8-c15d8271cac1'
    def credential = new FileCredentialsImpl(CredentialsScope.GLOBAL,
        'azure-taqueria-sp', 'Taqueria Website Contributor; expires 2026-11-06T06:33:08Z',
        'azure-sp.json', SecretBytes.fromBytes(bytes))
    assert store.addCredentials(domain, credential)
    privateFile.delete()
    println('AZURE_FOLDER_CREDENTIAL_STORED')
}

def job = folder.getItem('Deploy')
if (job == null) {
    def scm = new GitSCM('https://github.com/Taqueria-Alan/TaqueriaAlanSeminario.git')
    scm.branches = [new BranchSpec('*/main')]
    def definition = new CpsScmFlowDefinition(scm, 'Jenkinsfile.azure')
    definition.lightweight = true
    job = folder.createProject(WorkflowJob, 'Deploy')
    job.definition = definition
    job.description = 'Publica los seis JAR en Azure desde main; credencial limitada a esta carpeta.'
    job.save()
    job.scheduleBuild2(10, new ParametersAction(new BooleanParameterValue('DEPLOY_AZURE', true)))
    println('AZURE_PRODUCTION_JOB_CREATED')
} else {
    println('AZURE_PRODUCTION_JOB_EXISTS_UNCHANGED')
}
