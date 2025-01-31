import { App, ButtonComponent, Modal, Notice, PluginSettingTab, Setting } from "obsidian";

import ReadeckPlugin from "./plugin";

export class RDSettingTab extends PluginSettingTab {
	plugin: ReadeckPlugin;

	constructor(app: App, plugin: ReadeckPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		const loggedIn = this.plugin.settings.apiToken !== "";

		new Setting(containerEl)
			.setName('API URL')
			.setDesc('URL of Readeck instance (without trailing "/")')
			.addText(text => text
				.setPlaceholder('Enter your API URL')
				.setValue(this.plugin.settings.apiUrl)
				.onChange(async (value) => {
					this.plugin.settings.apiUrl = value;
					await this.plugin.saveSettings();
				}));

		let loginButton: ButtonComponent;
		let logoutButton: ButtonComponent;
		new Setting(containerEl)
			.setName('Login')
			.setDesc('Login and get a token')
			.addButton((btn) => {
				loginButton = btn;
				btn
					.setButtonText(loggedIn ? `Logged in as ${this.plugin.settings.username}` : 'Login')
					.setDisabled(loggedIn)
					.setCta()
					.onClick(async () => {
						// Do login
						new LoginModal(this.app, (username, password) => {
							this.plugin.api.getToken(username, password)
								.then(async (token) => {
									if (token) {
										// update values
										this.plugin.settings.apiToken = token;
										this.plugin.settings.username = username;
										await this.plugin.saveSettings();
										// update ui
										loginButton.setButtonText(`Logged in as ${this.plugin.settings.username}`);
										loginButton.setDisabled(true);
										logoutButton.setDisabled(false);
									} else {
										new Notice('Login error, check your credentials');
									}
								});
						}).open();

					})
			}
			)
			.addButton((btn) => {
				logoutButton = btn;
				btn
					.setButtonText('Logout')
					.setDisabled(!loggedIn)
					.onClick(async () => {
						// Do logout
						// update values
						this.plugin.settings.apiToken = "";
						this.plugin.settings.username = "";
						await this.plugin.saveSettings();
						// update ui
						loginButton.setButtonText('Login');
						loginButton.setDisabled(false);
						logoutButton.setDisabled(true);
					})
			});

		new Setting(containerEl)
			.setName('Folder')
			.setDesc('The folder where to save the notes')
			.addText(text => text
				.setPlaceholder('Readeck')
				.setValue(this.plugin.settings.folder)
				.onChange(async (value) => {
					this.plugin.settings.folder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Create if no annotations')
			.setDesc('Create the note even if the article has no annotations')
			.addToggle(toggle => toggle.setValue(this.plugin.settings.createNoteIfNoAnnotations)
				.onChange((value) => {
					this.plugin.settings.createNoteIfNoAnnotations = value;
					this.plugin.saveData(this.plugin.settings);
				}));

		new Setting(containerEl)
			.setName('Overwrite if it already exists')
			.setDesc('Overwrite the note if the bookmark already exists. Warning: the note will be overwritten')
			.addToggle(toggle => toggle.setValue(this.plugin.settings.overwriteIfExists)
				.onChange((value) => {
					this.plugin.settings.overwriteIfExists = value;
					this.plugin.saveData(this.plugin.settings);
				}));

		new Setting(containerEl)
			.setName('Set properties')
			.setDesc('Set the properties of the note')
			.addToggle(toggle => toggle.setValue(this.plugin.settings.setProperties)
				.onChange((value) => {
					this.plugin.settings.setProperties = value;
					this.plugin.saveData(this.plugin.settings);
				}));

		new Setting(containerEl)
			.setName('Get article')
			.setDesc('Create the note with the text of the article')
			.addToggle(toggle => toggle.setValue(this.plugin.settings.getArticle)
				.onChange((value) => {
					this.plugin.settings.getArticle = value;
					this.plugin.saveData(this.plugin.settings);
				}));

		new Setting(containerEl)
			.setName('Get annotations')
			.setDesc('Create the note with the annotations of the article')
			.addToggle(toggle => toggle.setValue(this.plugin.settings.getAnnotations)
				.onChange((value) => {
					this.plugin.settings.getAnnotations = value;
					this.plugin.saveData(this.plugin.settings);
				}));
	}
}

class LoginModal extends Modal {
	constructor(app: App, onSubmit: (username: string, password: string) => void) {
		super(app);
		
		this.contentEl.addClass("mod-form");
		this.modalEl.addClass("w-auto");
		this.setTitle('Login');

		let username = '';
		let password = '';

		new Setting(this.contentEl)
			.setName('Username')
			.setClass('form-field')
			.setClass('b-0')
			.setClass('align-start')
			.addText((text) =>
				text.onChange((value) => {
					username = value;
				}));

		new Setting(this.contentEl)
			.setName('Password')
			.setClass('form-field')
			.setClass('b-0')
			.setClass('align-start')
			.addText((text) =>
				text.onChange((value) => {
					password = value;
				}));

		new Setting(this.contentEl)
			.setClass('b-0')
			.addButton((btn) => btn
				.setButtonText('Submit')
				.setCta()
				.onClick(() => {
					this.close();
					onSubmit(username, password);
				}));
	}
}