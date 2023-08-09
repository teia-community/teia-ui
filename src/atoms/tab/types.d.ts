interface TabOptions {
  title: string
  to?: string
  disabled?: boolean
  /** moderator restrictions */
  restricted?: boolean
  /**only relevant when user is the owner*/
  private?: boolean
}

interface TabsProps {
  tabs: TabOptions[]
  className?: string
  /**A method to filter out the tabs */
  filter?: (tabs: TabOptions) => TabOptions | null
}
