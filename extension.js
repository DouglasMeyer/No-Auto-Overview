const Main = imports.ui.main;
const Meta = imports.gi.Meta;

var origMain_checkWorkspaces,
    noShow_checkWorkspaces;

function init() {
  origMain_checkWorkspaces = Main._checkWorkspaces;
  noShow_checkWorkspaces = function() {
    var _workspaces = Main._workspaces,
        overview = Main.overview,
        wm = Main.wm;

    let i;
    let emptyWorkspaces = [];

    for (i = 0; i < _workspaces.length; i++) {
        let lastRemoved = _workspaces[i]._lastRemovedWindow;
        if (lastRemoved &&
            (lastRemoved.get_window_type() == Meta.WindowType.SPLASHSCREEN ||
             lastRemoved.get_window_type() == Meta.WindowType.DIALOG ||
             lastRemoved.get_window_type() == Meta.WindowType.MODAL_DIALOG))
                emptyWorkspaces[i] = false;
        else
            emptyWorkspaces[i] = true;
    }

    let windows = global.get_window_actors();
    for (i = 0; i < windows.length; i++) {
        let win = windows[i];

        if (win.get_meta_window().is_on_all_workspaces())
            continue;

        let workspaceIndex = win.get_workspace();
        emptyWorkspaces[workspaceIndex] = false;
    }

    // If we don't have an empty workspace at the end, add one
    if (!emptyWorkspaces[emptyWorkspaces.length -1]) {
        global.screen.append_new_workspace(false, global.get_current_time());
        emptyWorkspaces.push(false);
    }

    let activeWorkspaceIndex = global.screen.get_active_workspace_index();
    let removingCurrentWorkspace = (emptyWorkspaces[activeWorkspaceIndex] &&
                                    activeWorkspaceIndex < emptyWorkspaces.length - 1);
    // Don't enter the overview when removing multiple empty workspaces at startup
    let showOverview  = (removingCurrentWorkspace &&
                         !emptyWorkspaces.every(function(x) { return x; }));

    if (removingCurrentWorkspace) {
        // "Merge" the empty workspace we are removing with the one at the end
        wm.blockAnimations();
    }

    // Delete other empty workspaces; do it from the end to avoid index changes
    for (i = emptyWorkspaces.length - 2; i >= 0; i--) {
        if (emptyWorkspaces[i])
            global.screen.remove_workspace(_workspaces[i], global.get_current_time());
    }

//NOTE: Besides variable declarations and referencing some `Main.` variables,
//      this is the only thing changed from the original Main._checkWorkspaces.
//      This stops the overview from being shown when all windows on a workspace
//      are removed.
//    if (removingCurrentWorkspace) {
//        global.screen.get_workspace_by_index(global.screen.n_workspaces - 1).activate(global.get_current_time());
//        wm.unblockAnimations();
//
//        if (!overview.visible && showOverview)
//            overview.show();
//    }

    Main._checkWorkspacesId = 0;
    return false;
  }
}

function enable() {
  Main._checkWorkspaces = noShow_checkWorkspaces;
}
function disable() {
  Main._checkWorkspaces = origMain_checkWorkspaces;
}
