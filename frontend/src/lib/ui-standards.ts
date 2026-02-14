export const UI_STANDARDS = {
    // Layout Containers
    pageContainer: "container mx-auto py-0 space-y-5 max-w-7xl animate-in fade-in duration-500",
    mainGrid: "grid grid-cols-1 lg:grid-cols-2 gap-6 items-start",

    // Module Header
    header: {
        container: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 animate-in fade-in slide-in-from-left-4 duration-500",
        iconContainer: "w-12 h-12 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-center transition-colors hover:border-primary/60 hover:bg-primary/10",
        icon: "w-6 h-6 text-primary",
        titleContainer: "flex-1",
        title: "text-3xl font-bold text-foreground",
        subtitle: "text-muted-foreground text-sm",
        actionsContainer: "flex items-center gap-2"
    },

    // Cards
    card: {
        root: "glass border-primary/20",
        header: "pb-3 pt-4 px-4 md:px-6 bg-gradient-to-r from-primary/5 to-transparent",
        title: "text-base font-semibold flex items-center gap-2",
        content: "p-4 md:p-6 pt-2", // Default content padding, adjust as needed
        footer: "p-4 md:p-6 bg-muted/20 border-t border-border/50"
    },

    // Forms/Inputs
    form: {
        section: "space-y-4 animate-in slide-in-from-left-5 duration-300",
        label: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        input: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    },

    // Status/Feedback
    status: {
        success: "text-green-600 dark:text-green-500",
        error: "text-red-600 dark:text-red-500",
        warning: "text-yellow-600 dark:text-yellow-500",
        info: "text-blue-600 dark:text-blue-500"
    },

    // Animations
    animations: {
        slideInLeft: "animate-in slide-in-from-left-5 duration-300",
        slideInRight: "animate-in slide-in-from-right-5 duration-300",
        fadeIn: "animate-in fade-in duration-500"
    }
} as const;
