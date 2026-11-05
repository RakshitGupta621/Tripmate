import { BedDouble, Bus, ShoppingBag, Sparkles, Utensils, Wallet } from 'lucide-react'
import SpotlightSurface from '../SpotlightSurface/SpotlightSurface'
import { formatMoney } from '../../utils/trip.js'
import { fillText } from '../../utils/util_constants.js'
import appContent from '../../appContent.json'
import type { BudgetBreakdownProps } from './BudgetBreakdown.types'

const CATEGORY_ICONS = Object.freeze({
  Travel: Bus,
  Stay: BedDouble,
  Food: Utensils,
  Shopping: ShoppingBag,
  Activities: Sparkles,
})

export default function BudgetBreakdown({ allocation }: BudgetBreakdownProps) {
  if (!allocation) return null
  const content = appContent.budget
  const people = allocation.people || 1
  return (
    <SpotlightSurface as="section" className="budget-card" aria-label={content.regionLabel}>
      <div className="budget-card-heading">
        <span className="budget-card-icon">
          <Wallet size={18} />
        </span>
        <div>
          <span className="meta-label">{content.title}</span>
          <h3>
            {formatMoney(allocation.total)} <small>{content.totalLabel}</small>
          </h3>
        </div>
      </div>
      <p className="budget-caption">
        {fillText(content.caption, {
          count: people,
          traveler: people === 1 ? content.traveler : content.travelers,
        })}
      </p>
      {allocation.categories?.length ? (
        <div className="budget-rows">
          {allocation.categories.map((item) => {
            const Icon = CATEGORY_ICONS[item.category] || Sparkles
            return (
              <div className="budget-row" key={item.category}>
                <span className={`budget-category-icon budget-${item.category.toLowerCase()}`}>
                  <Icon size={15} />
                </span>
                <span className="budget-category-name">
                  {item.category}
                  <small>{item.percent}%</small>
                </span>
                <span className="budget-track">
                  <span style={{ width: `${item.percent}%` }} />
                </span>
                <b>{formatMoney(item.amount)}</b>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="budget-estimate-note">{content.estimateNote}</p>
      )}
      {allocation.estimated && allocation.categories.length > 0 && (
        <p className="budget-estimate-note">{content.estimateNote}</p>
      )}
    </SpotlightSurface>
  )
}
